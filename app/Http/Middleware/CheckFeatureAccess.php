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

        // Evaluate cached store & license with real-time expiration check
        $evaluated = \App\Support\AccessCache::evaluateStoreLicense((string) $requestedStoreId);
        if (!$evaluated['store_exists']) {
            return response()->json(['error' => 'Store not found'], 404);
        }

        $licenseStatus = $evaluated['licenseStatus'];
        if (($licenseStatus['status'] ?? 'none') === 'none') {
            return $next($request);
        }

        if (empty($licenseStatus['valid'])) {
            return response()->json(['error' => 'License expired or suspended. Please renew your subscription.'], 403);
        }

        $features = $evaluated['storeFeatures'] ?? [];
        if (empty($features) || !is_array($features)) {
            return response()->json(['error' => 'Feature not enabled in your current plan.'], 403);
        }

        if (!isset($features[$featureKey]) || $features[$featureKey] !== true) {
            return response()->json(['error' => "Forbidden: The '{$featureKey}' feature is not enabled in your current subscription plan."], 403);
        }

        return $next($request);
    }
}
