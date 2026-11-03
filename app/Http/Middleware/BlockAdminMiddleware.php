<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

/**
 * BlockAdminMiddleware — protects normal /dashboard/* routes.
 * Prevents system admins from accidentally using normal user routes.
 * If an admin hits a normal user route, they are redirected to /admin/dashboard.
 */
class BlockAdminMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        if (!Auth::check()) {
            return $next($request);
        }

        $userId = Auth::id();
        $isAdmin = DB::table('admin_roles')
            ->where('user_id', $userId)
            ->where('is_active', true)
            ->exists();

        if ($isAdmin) {
            // Admin is trying to use normal user routes — redirect to admin dashboard
            return redirect('/admin/dashboard');
        }

        return $next($request);
    }
}
