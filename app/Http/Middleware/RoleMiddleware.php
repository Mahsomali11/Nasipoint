<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

/**
 * RoleMiddleware — enforces strict separation between Platform Super Admins ('super_admin')
 * and Tenant Store Users ('owner', 'admin', 'cashier', 'inventory_manager').
 */
class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        if (!Auth::check()) {
            if ($request->expectsJson()) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
            $expectsSuperAdmin = in_array('super_admin', $roles, true);
            return redirect()->route($expectsSuperAdmin ? 'admin.login' : 'login');
        }

        $user = Auth::user();
        $access = \App\Support\AccessCache::getUserAccess($user);
        $isPlatformAdmin = !empty($access['is_admin']);
        $storeRole = $access['role'] ?? 'staff';

        // Normalize effective role: Platform Super Admins are 'super_admin', Store users have their store role ('owner', 'admin', 'cashier', 'inventory_manager')
        $effectiveRole = $isPlatformAdmin ? 'super_admin' : $storeRole;

        $allowed = false;
        foreach ($roles as $requiredRole) {
            $requiredRole = strtolower(trim($requiredRole));
            if ($requiredRole === 'super_admin' && $isPlatformAdmin) {
                $allowed = true;
                break;
            }
            if ($requiredRole === 'store_user' && !$isPlatformAdmin) {
                $allowed = true;
                break;
            }
            if (!$isPlatformAdmin && $effectiveRole === $requiredRole) {
                $allowed = true;
                break;
            }
        }

        if (!$allowed) {
            if ($request->expectsJson()) {
                return response()->json([
                    'error' => 'Forbidden: You do not have permission to access this portal.',
                ], 403);
            }

            if ($isPlatformAdmin) {
                return redirect('/admin/dashboard');
            }

            return redirect('/dashboard');
        }

        return $next($request);
    }
}
