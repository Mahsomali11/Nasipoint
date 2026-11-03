<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class PreventDuplicateSubmissions
{
    /**
     * Handle an incoming request.
     * Prevents rapid duplicate form / transaction submissions within 2 seconds.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Only guard state-mutating requests (POST, PUT, PATCH, DELETE)
        if (!in_array($request->method(), ['POST', 'PUT', 'PATCH', 'DELETE'])) {
            return $next($request);
        }

        // Exclude authentication login/logout requests from strict idempotency
        $path = $request->path();
        if (str_contains($path, 'login') || str_contains($path, 'logout')) {
            return $next($request);
        }

        $userId = $request->user()?->id ?? ('ip_' . $request->ip());
        $idempotencyHeader = $request->header('X-Idempotency-Key');

        if (!empty($idempotencyHeader)) {
            $cacheKey = "idemp:hdr:{$userId}:{$idempotencyHeader}";
        } else {
            $body = $request->getContent();
            $hash = md5($path . '|' . $body);
            $cacheKey = "idemp:sig:{$userId}:{$hash}";
        }

        // Cache::add is atomic: returns true only if the key did NOT exist previously
        $lockAcquired = Cache::add($cacheKey, microtime(true), 2); // 2 second TTL

        if (!$lockAcquired) {
            Log::warning("PreventDuplicateSubmissions: Blocked rapid duplicate request to [{$path}] for user [{$userId}]");
            return response()->json([
                'error' => 'Duplicate submission detected. Transaction is already processing, please wait.'
            ], 429);
        }

        try {
            $response = $next($request);

            // If request failed validation (422 or 400), clear lock so the user can fix the input and retry immediately
            if ($response->getStatusCode() === 422 || $response->getStatusCode() === 400) {
                Cache::forget($cacheKey);
            }

            return $response;
        } catch (\Throwable $e) {
            Cache::forget($cacheKey);
            throw $e;
        }
    }
}
