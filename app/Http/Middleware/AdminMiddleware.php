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

        $user = Auth::user();
        $access = $user ? \App\Support\AccessCache::getUserAccess($user) : ['is_admin' => false];
        $isAdmin = $access['is_admin'];

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
