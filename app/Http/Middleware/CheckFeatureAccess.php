<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Illuminate\Support\Facades\DB;
use App\Models\Store;

class CheckFeatureAccess
{
    /**
     * Map database tables / API endpoints to Feature Keys.
     * This matches the frontend ALL_FEATURES keys.
     */
    protected array $tableFeatureMap = [
        'sales' => 'pos_sales',
        'sale_items' => 'pos_sales',
        'items' => 'inventory',
        'categories' => 'inventory',
        'purchases' => 'purchases',
        'purchase_items' => 'purchases',
        'customers' => 'customers',
        'customer_debts' => 'credit_sales',
        'expenses' => 'expenses',
        'cash_sessions' => 'cash_flow',
        'cash_movements' => 'cash_flow',
        'account_transfers' => 'account_transfers',
        'staff_accounts' => 'staff_accounts',
        'stock_transfers' => 'stock_transfers',
        'suppliers' => 'suppliers',
        'returns' => 'returns',
        // other tables like stores, profiles, plans are core/admin
    ];

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $table = $request->route('table');
        
        // If it's not a dynamic REST table route, or not mapped to a specific feature, allow it.
        // Some core tables like 'stores', 'payment_accounts' are always allowed.
        if (!$table || !isset($this->tableFeatureMap[$table])) {
            return $next($request);
        }

        $featureKey = $this->tableFeatureMap[$table];

        // Get the requested store ID
        $requestedStoreId = $request->query('store_id') 
            ?? $request->input('store_id') 
            ?? $request->query('eq.store_id') 
            ?? $request->input('eq.store_id');

        if (!$requestedStoreId) {
            // If we can't determine the store, we can't check its features.
            // CheckStoreAccess handles the store presence, so we'll just pass here.
            return $next($request);
        }

        if (is_string($requestedStoreId) && str_starts_with($requestedStoreId, 'eq.')) {
            $requestedStoreId = substr($requestedStoreId, 3);
        }

        // Get store owner
        $store = Store::find($requestedStoreId);
        if (!$store) {
            return response()->json(['error' => 'Store not found'], 404);
        }

        // Check license and features for this owner/store
        // 1. Query active license for this store/owner first
        $license = DB::table('licenses')
            ->where(function ($q) use ($store) {
                $q->where('owner_user_id', $store->owner_user_id);
                if ($store->id) {
                    $q->orWhere('store_id', $store->id);
                }
            })
            ->where('status', 'active')
            ->orderBy('expiry_date', 'desc')
            ->first();

        // 2. If no active license found, fetch the most recent license record
        if (!$license) {
            $license = DB::table('licenses')
                ->where(function ($q) use ($store) {
                    $q->where('owner_user_id', $store->owner_user_id);
                    if ($store->id) {
                        $q->orWhere('store_id', $store->id);
                    }
                })
                ->orderBy('created_at', 'desc')
                ->first();
        }

        // If no license system applied yet, assume all features enabled (backward compatibility)
        if (!$license || $license->status === 'none') {
            return $next($request);
        }

        $status = strtolower($license->status ?? '');

        // Explicitly block if status is suspended, canceled, or expired
        if (in_array($status, ['suspended', 'canceled', 'cancelled', 'expired'])) {
            return response()->json(['error' => 'License expired or suspended. Please renew your subscription.'], 403);
        }

        // Timestamp validation: A store MUST be allowed full system access and checkout capabilities
        // until the exact expiration timestamp (expires_at > now()).
        // Only block transactions if expires_at <= now().
        $expiryTimestamp = $license->expiry_date ?? $license->expires_at ?? null;
        if ($expiryTimestamp) {
            $expiresAt = \Carbon\Carbon::parse($expiryTimestamp);
            if ($expiresAt->lessThanOrEqualTo(now())) {
                return response()->json(['error' => 'License expired or suspended. Please renew your subscription.'], 403);
            }
        }

        // Must be active to proceed
        if ($status !== 'active') {
            return response()->json(['error' => 'License expired or suspended. Please renew your subscription.'], 403);
        }

        $features = json_decode($license->features_enabled, true);

        // If features is somehow invalid or empty, deny
        if (!is_array($features) || empty($features)) {
            return response()->json(['error' => 'Feature not enabled in your current plan.'], 403);
        }

        if (!isset($features[$featureKey]) || $features[$featureKey] !== true) {
            return response()->json(['error' => "Forbidden: The '{$featureKey}' feature is not enabled in your current subscription plan."], 403);
        }

        return $next($request);
    }
}
