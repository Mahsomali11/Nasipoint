<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * AdminMiddleware — protects all /admin/* routes.
 * Ensures the authenticated user has an active record in admin_roles.
 * Redirects unauthenticated users to /admin/login.
 * Returns 403 for authenticated non-admin users.
 */
class AdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        // Must be authenticated
        if (!Auth::check()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            return redirect()->route('admin.login');
        }

        $userId = Auth::id();

        // Must have an active admin_roles entry
        $isAdmin = DB::table('admin_roles')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if (!$isAdmin) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            if ($request->expectsJson()) {
                return response()->json([
                    'message' => 'Access denied. You are not a platform administrator.',
                ], 403);
            }

            return redirect()->route('admin.login')
                ->withErrors(['email' => 'Access denied. You are not a platform administrator.']);
        }

        return $next($request);
    }
}
