<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckStoreAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        if (!$user) {
            \Illuminate\Support\Facades\Log::warning("CheckStoreAccess 401: No user. URL: " . $request->fullUrl() . " Cookie: " . json_encode($request->cookie()));
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        // 1. Determine requested store_id from query or body
        $requestedStoreId = $request->query('store_id') 
            ?? $request->input('store_id') 
            ?? $request->query('eq.store_id') 
            ?? $request->input('eq.store_id');
            
        // Some endpoints like /api/rest/v1/stores might not have store_id but ID itself
        if ($request->route('table') === 'stores') {
            $requestedStoreId = $request->query('id') ?? $request->input('id') ?? $request->query('eq.id') ?? $request->input('eq.id');
        }

        if (!$requestedStoreId || in_array($request->route('table'), ['profiles'])) {
            // If the endpoint doesn't specify a store_id, we either pass it through or 
            // the endpoint must handle authorization itself. 
            // For now, let it pass (e.g. GET /api/user).
            $request->attributes->set('store_role', 'guest');
            return $next($request);
        }

        // Clean eq. from parsed values if any
        if (is_string($requestedStoreId) && str_starts_with($requestedStoreId, 'eq.')) {
            $requestedStoreId = substr($requestedStoreId, 3);
        }

        $access = \App\Support\AccessCache::getUserAccess($user);
        $requestedStoreIdStr = (string) $requestedStoreId;

        // 2. Check if user is an owner of this store (via cache, with DB fallback if store was just created)
        $isOwner = in_array($requestedStoreIdStr, $access['owned_store_ids'], true);
        if (!$isOwner) {
            $isOwner = \App\Models\Store::where('id', $requestedStoreIdStr)
                ->where('owner_user_id', $user->id)
                ->exists();
            if ($isOwner) {
                \App\Support\AccessCache::clearUserAccess((string) $user->id);
            }
        }

        if ($isOwner) {
            $request->attributes->set('store_role', 'owner');
            return $next($request);
        }

        // 3. Check if user is staff for this store (via cache, with DB fallback if staff was just invited)
        $staffRole = $access['staff_roles_by_store'][$requestedStoreIdStr] ?? null;
        if (!$staffRole) {
            $staff = \App\Models\StaffAccount::where(function ($q) use ($user) {
                $q->where('user_id', $user->id);
                if (!empty($user->email)) {
                    $q->orWhere('email', $user->email);
                }
            })
                ->where('store_id', $requestedStoreIdStr)
                ->where('is_active', true)
                ->first();

            if ($staff) {
                if (empty($staff->user_id)) {
                    $staff->update(['user_id' => $user->id]);
                }
                $staffRole = $staff->role;
                \App\Support\AccessCache::clearUserAccess((string) $user->id);
            }
        }

        if ($staffRole) {
            $request->attributes->set('store_role', $staffRole);

            // Check basic role restrictions for the entire store
            if (in_array($request->route('table'), ['stores', 'staff_accounts']) && $request->method() !== 'GET') {
                if ($staffRole !== 'admin') {
                    \Illuminate\Support\Facades\Log::warning("CheckStoreAccess 403: Role restriction. User: " . $user->id . " Role: " . $staffRole . " Table: " . $request->route('table'));
                    return response()->json(['error' => 'Forbidden: You do not have permission to modify store settings or staff.'], 403);
                }
            }

            return $next($request);
        }

        \Illuminate\Support\Facades\Log::warning("CheckStoreAccess 403: Forbidden for user " . $user->id . " Store: " . $requestedStoreId);
        return response()->json(['error' => 'Forbidden: You do not have access to this store'], 403);
    }
}
