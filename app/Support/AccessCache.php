<?php

namespace App\Support;

use App\Models\StaffAccount;
use App\Models\Store;
use App\Models\SystemSetting;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AccessCache
{
    protected static array $userAccessMemo = [];
    protected static array $storeLicenseMemo = [];
    protected static ?array $brandingMemo = null;

    public const DEFAULT_ALL_FEATURES = [
        'pos_sales' => true,
        'inventory' => true,
        'purchases' => true,
        'customers' => true,
        'credit_sales' => true,
        'expenses' => true,
        'cash_flow' => true,
        'reports' => true,
        'pdf_export' => true,
        'excel_export' => true,
        'multi_store' => true,
        'staff_accounts' => true,
        'stock_transfers' => true,
        'suppliers' => true,
        'returns' => true,
        'account_transfers' => true,
    ];

    public const LOCKED_FEATURES = [
        'pos_sales' => false,
        'inventory' => false,
        'purchases' => false,
        'customers' => false,
        'credit_sales' => false,
        'expenses' => false,
        'cash_flow' => false,
        'reports' => false,
        'pdf_export' => false,
        'excel_export' => false,
        'multi_store' => false,
        'staff_accounts' => false,
        'stock_transfers' => false,
        'suppliers' => false,
        'returns' => false,
        'account_transfers' => false,
    ];

    /**
     * Get cached user roles, store ownership, staff assignments, and accessible stores.
     */
    public static function getUserAccess(User $user): array
    {
        $userId = (string) $user->id;

        if (isset(self::$userAccessMemo[$userId])) {
            return self::$userAccessMemo[$userId];
        }

        $data = Cache::remember("user_access_{$userId}", 120, function () use ($user, $userId) {
            $adminRoleRow = DB::table('admin_roles')
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->select(['role'])
                ->first();

            $ownedStores = Store::where('owner_user_id', $userId)->get();

            $ownedStoreIds = $ownedStores->pluck('id')->map(fn ($id) => (string) $id)->values()->all();
            $isAnyOwner = !empty($ownedStoreIds);

            $staffAccounts = StaffAccount::where(function ($q) use ($userId, $user) {
                $q->where('user_id', $userId);
                if (!empty($user->email)) {
                    $q->orWhere('email', $user->email);
                }
            })
                ->where('is_active', true)
                ->get(['id', 'store_id', 'user_id', 'email', 'role', 'is_active']);

            $staffRolesByStore = [];
            $primaryStaffRole = null;
            $assignedStoreId = null;

            foreach ($staffAccounts as $staff) {
                if (empty($staff->user_id)) {
                    $staff->update(['user_id' => $userId]);
                }
                $sId = (string) $staff->store_id;
                $staffRolesByStore[$sId] = $staff->role;
                if ($primaryStaffRole === null) {
                    $primaryStaffRole = $staff->role;
                    $assignedStoreId = $sId;
                }
            }

            $role = $isAnyOwner ? 'owner' : $primaryStaffRole;

            if ($isAnyOwner) {
                $stores = $ownedStores->map(fn ($s) => $s->toArray())->values()->all();
            } elseif (!empty($staffRolesByStore)) {
                $staffStoreIds = array_keys($staffRolesByStore);
                $stores = Store::whereIn('id', $staffStoreIds)
                    ->get()
                    ->map(fn ($s) => $s->toArray())->values()->all();
            } else {
                $stores = [];
            }

            // A user assigned to a tenant store (Store Owner, Store Admin, Cashier, Inventory Manager)
            // is strictly a Tenant Store User and can NEVER be treated as a Platform Super Admin.
            $isTenantStoreUser = $isAnyOwner || !empty($staffRolesByStore);
            $isPlatformAdmin = ($adminRoleRow !== null) && !$isTenantStoreUser;
            $isStaffOnly = !$isAnyOwner && !empty($staffRolesByStore);

            $quota = self::evaluateUserStoreQuota(
                $userId,
                count($ownedStoreIds),
                $isPlatformAdmin,
                $isStaffOnly
            );

            return [
                'is_admin' => $isPlatformAdmin,
                'admin_role' => $isPlatformAdmin ? ($adminRoleRow?->role ?? null) : null,
                'is_any_owner' => $isAnyOwner,
                'owned_store_ids' => $ownedStoreIds,
                'owned_stores_count' => $quota['owned_stores_count'],
                'max_stores' => $quota['max_stores'],
                'can_create_store' => $quota['can_create_store'],
                'store_creation_reason' => $quota['reason'],
                'staff_roles_by_store' => $staffRolesByStore,
                'role' => $isPlatformAdmin ? 'super_admin' : $role,
                'assigned_store_id' => $isPlatformAdmin ? null : $assignedStoreId,
                'stores' => $isPlatformAdmin ? [] : $stores,
            ];
        });

        self::$userAccessMemo[$userId] = $data;
        return $data;
    }

    /**
     * Evaluate a user's store creation quota from their active subscription/license plan.
     *
     * Rules:
     * - Platform admins and staff-only users cannot create tenant stores.
     * - A user with 0 owned stores may create their first initial store (max_stores >= 1).
     * - To create additional stores (owned_stores_count >= 1), the user MUST have an active
     *   license/subscription plan with max_stores > 1 and owned_stores_count < max_stores.
     */
    public static function evaluateUserStoreQuota(
        string $userId,
        ?int $ownedStoresCount = null,
        bool $isPlatformAdmin = false,
        bool $isStaffOnly = false
    ): array {
        $ownedCount = $ownedStoresCount ?? Store::where('owner_user_id', $userId)->count();

        if ($isPlatformAdmin || $isStaffOnly) {
            return [
                'owned_stores_count' => $ownedCount,
                'max_stores' => 0,
                'can_create_store' => false,
                'reason' => 'Only store owners can create stores.',
            ];
        }

        $license = DB::table('licenses')
            ->leftJoin('plans', 'licenses.plan_id', '=', 'plans.id')
            ->select([
                'licenses.id',
                'licenses.status',
                'licenses.expiry_date',
                'licenses.plan_id',
                'plans.name as plan_name',
                'plans.max_stores as plan_max_stores',
            ])
            ->where('licenses.owner_user_id', $userId)
            ->orderByRaw("CASE WHEN licenses.status = 'suspended' THEN 1 ELSE 0 END ASC")
            ->orderBy('licenses.expiry_date', 'desc')
            ->orderBy('licenses.created_at', 'desc')
            ->first();

        if (!$license && $ownedCount > 0) {
            $ownedStoreIds = Store::where('owner_user_id', $userId)->pluck('id')->all();
            if (!empty($ownedStoreIds)) {
                $license = DB::table('licenses')
                    ->leftJoin('plans', 'licenses.plan_id', '=', 'plans.id')
                    ->select([
                        'licenses.id',
                        'licenses.status',
                        'licenses.expiry_date',
                        'licenses.plan_id',
                        'plans.name as plan_name',
                        'plans.max_stores as plan_max_stores',
                    ])
                    ->whereIn('licenses.store_id', $ownedStoreIds)
                    ->orderByRaw("CASE WHEN licenses.status = 'suspended' THEN 1 ELSE 0 END ASC")
                    ->orderBy('licenses.expiry_date', 'desc')
                    ->orderBy('licenses.created_at', 'desc')
                    ->first();
            }
        }

        $maxStores = 1;
        $isLicenseValid = true;
        $planName = 'Free Trial';

        if ($license) {
            $planName = $license->plan_name ?? 'Current Plan';
            $maxStores = isset($license->plan_max_stores) ? max(1, (int) $license->plan_max_stores) : 1;

            $status = strtolower((string) ($license->status ?? ''));
            if ($status === 'suspended') {
                $isLicenseValid = false;
            } elseif (!empty($license->expiry_date)) {
                $expiresAt = Carbon::parse($license->expiry_date)->startOfDay();
                $daysLeft = (int) ceil(($expiresAt->getTimestamp() - Carbon::now()->getTimestamp()) / 86400);
                $isLicenseValid = ($daysLeft >= 0);
            }
        } else {
            $sub = DB::table('subscriptions')
                ->leftJoin('plans', 'subscriptions.plan_id', '=', 'plans.id')
                ->select([
                    'subscriptions.status',
                    'subscriptions.end_date',
                    'plans.name as plan_name',
                    'plans.max_stores as plan_max_stores',
                ])
                ->where('subscriptions.owner_user_id', $userId)
                ->where('subscriptions.status', 'active')
                ->orderBy('subscriptions.created_at', 'desc')
                ->first();

            if ($sub) {
                $planName = $sub->plan_name ?? 'Current Plan';
                $maxStores = isset($sub->plan_max_stores) ? max(1, (int) $sub->plan_max_stores) : 1;
            }
        }

        if ($ownedCount === 0) {
            return [
                'owned_stores_count' => 0,
                'max_stores' => max(1, $maxStores),
                'can_create_store' => true,
                'reason' => null,
            ];
        }

        $canCreateStore = $isLicenseValid && ($maxStores > 1) && ($ownedCount < $maxStores);
        $reason = null;

        if (!$canCreateStore) {
            if (!$isLicenseValid) {
                $reason = 'Your subscription license is not active. Please renew or upgrade your plan to create additional stores.';
            } elseif ($maxStores <= 1) {
                $reason = "Your current plan ({$planName}) only allows 1 store. Please upgrade your subscription plan to create multiple stores.";
            } else {
                $reason = "You have reached the maximum limit of {$maxStores} stores allowed on your current plan ({$planName}). Please upgrade your plan to add more stores.";
            }
        }

        return [
            'owned_stores_count' => $ownedCount,
            'max_stores' => $maxStores,
            'can_create_store' => $canCreateStore,
            'reason' => $reason,
        ];
    }

    /**
     * Get cached store & license record for a store.
     */
    public static function getStoreLicense(string $storeId): array
    {
        if (isset(self::$storeLicenseMemo[$storeId])) {
            return self::$storeLicenseMemo[$storeId];
        }

        $data = Cache::remember("store_license_{$storeId}", 120, function () use ($storeId) {
            $store = Store::select(['id', 'owner_user_id', 'store_name'])->find($storeId);
            if (!$store) {
                return [
                    'store_exists' => false,
                    'owner_user_id' => null,
                    'license' => null,
                ];
            }

            $license = DB::table('licenses')
                ->leftJoin('plans', 'licenses.plan_id', '=', 'plans.id')
                ->select([
                    'licenses.*',
                    'plans.name as resolved_plan_name',
                    'plans.features as plan_features',
                    'plans.max_stores as plan_max_stores',
                    'plans.max_users as plan_max_users',
                    'plans.max_devices as plan_max_devices',
                ])
                ->where(function ($q) use ($store) {
                    $q->where('licenses.owner_user_id', $store->owner_user_id);
                    if ($store->id) {
                        $q->orWhere('licenses.store_id', $store->id);
                    }
                })
                ->orderByRaw("CASE WHEN licenses.status = 'suspended' THEN 1 ELSE 0 END ASC")
                ->orderBy('licenses.expiry_date', 'desc')
                ->orderBy('licenses.created_at', 'desc')
                ->first();

            $licenseArr = null;
            if ($license) {
                $rawFeatures = is_string($license->features_enabled)
                    ? json_decode($license->features_enabled, true)
                    : (array) ($license->features_enabled ?? []);

                if (empty($rawFeatures) && !empty($license->plan_features)) {
                    $rawFeatures = is_string($license->plan_features)
                        ? json_decode($license->plan_features, true)
                        : (array) $license->plan_features;
                }

                $normalizedFeatures = [];
                if (is_array($rawFeatures) && !empty($rawFeatures)) {
                    if (array_is_list($rawFeatures)) {
                        foreach ($rawFeatures as $featureKey) {
                            if (is_string($featureKey) && array_key_exists($featureKey, self::DEFAULT_ALL_FEATURES)) {
                                $normalizedFeatures[$featureKey] = true;
                            }
                        }
                    } else {
                        foreach ($rawFeatures as $featureKey => $enabled) {
                            if (is_string($featureKey)) {
                                $normalizedFeatures[$featureKey] = (bool) $enabled;
                            }
                        }
                    }
                }

                $planName = $license->resolved_plan_name
                    ?? ($license->plan_name ?? 'Free Trial');

                $licenseArr = [
                    'id' => $license->id,
                    'status' => $license->status ?? 'none',
                    'plan_name' => $planName,
                    'billing_cycle' => $license->billing_cycle ?? 'monthly',
                    'expiry_date' => $license->expiry_date ?? $license->expires_at ?? null,
                    'max_stores' => isset($license->plan_max_stores) ? max(1, (int) $license->plan_max_stores) : 1,
                    'max_users' => (int) ($license->max_users ?? $license->plan_max_users ?? 1),
                    'max_devices' => (int) ($license->max_devices ?? $license->plan_max_devices ?? 1),
                    'features_enabled' => $normalizedFeatures,
                ];
            }

            return [
                'store_exists' => true,
                'owner_user_id' => $store->owner_user_id,
                'license' => $licenseArr,
            ];
        });

        self::$storeLicenseMemo[$storeId] = $data;
        return $data;
    }

    /**
     * Evaluate real-time license status & store features for frontend consumption and middleware checks.
     *
     * Rules:
     * - Days Left = ceil((expiry_date - now()) in days)
     * - Whenever expiry_date >= now() (days_left >= 0) and status != 'suspended', the license is strictly 'active'.
     */
    public static function evaluateStoreLicense(string $storeId): array
    {
        $cached = self::getStoreLicense($storeId);
        if (!$cached['store_exists']) {
            return [
                'store_exists' => false,
                'licenseStatus' => ['valid' => true, 'status' => 'none', 'days_left' => 365, 'days_remaining' => 365],
                'storeFeatures' => self::DEFAULT_ALL_FEATURES,
            ];
        }

        $license = $cached['license'];
        if (!$license || ($license['status'] ?? 'none') === 'none') {
            return [
                'store_exists' => true,
                'licenseStatus' => ['valid' => true, 'status' => 'none', 'days_left' => 365, 'days_remaining' => 365],
                'storeFeatures' => self::DEFAULT_ALL_FEATURES,
            ];
        }

        $status = strtolower((string) ($license['status'] ?? ''));
        $expiryDate = $license['expiry_date'] ?? null;

        if ($expiryDate) {
            $expiresAt = Carbon::parse($expiryDate)->startOfDay();
            $now = Carbon::now();
            $daysLeft = (int) ceil(($expiresAt->getTimestamp() - $now->getTimestamp()) / 86400);
            if ($daysLeft === 0) {
                $daysLeft = 0; // Normalize -0 to 0
            }
            $endOfExpiryDay = $expiresAt->copy()->endOfDay();
            $hoursLeft = max(0, (int) ceil(($endOfExpiryDay->getTimestamp() - $now->getTimestamp()) / 3600));
        } else {
            $daysLeft = 365;
            $hoursLeft = 8760;
        }

        if ($status === 'suspended') {
            return [
                'store_exists' => true,
                'licenseStatus' => [
                    'valid' => false,
                    'status' => 'suspended',
                    'plan_name' => $license['plan_name'],
                    'billing_cycle' => $license['billing_cycle'],
                    'expiry_date' => $expiryDate,
                    'days_left' => $daysLeft,
                    'days_remaining' => $daysLeft,
                    'hours_left' => 0,
                ],
                'storeFeatures' => self::LOCKED_FEATURES,
            ];
        }

        if ($daysLeft < 0) {
            if ($status === 'active' && !empty($license['id'])) {
                try {
                    DB::table('licenses')->where('id', $license['id'])->update(['status' => 'expired']);
                } catch (\Throwable $e) {
                }
            }

            return [
                'store_exists' => true,
                'licenseStatus' => [
                    'valid' => false,
                    'status' => 'expired',
                    'plan_name' => $license['plan_name'],
                    'billing_cycle' => $license['billing_cycle'],
                    'expiry_date' => $expiryDate,
                    'days_left' => $daysLeft,
                    'days_remaining' => $daysLeft,
                    'hours_left' => 0,
                ],
                'storeFeatures' => self::LOCKED_FEATURES,
            ];
        }

        // days_left >= 0 and status != 'suspended' => strictly ACTIVE
        if ($status !== 'active' && !empty($license['id'])) {
            try {
                DB::table('licenses')->where('id', $license['id'])->update(['status' => 'active']);
                self::$storeLicenseMemo[$storeId]['license']['status'] = 'active';
                Cache::forget("store_license_{$storeId}");
            } catch (\Throwable $e) {
            }
        }

        $features = !empty($license['features_enabled']) && is_array($license['features_enabled'])
            ? array_merge(self::LOCKED_FEATURES, $license['features_enabled'])
            : self::DEFAULT_ALL_FEATURES;

        return [
            'store_exists' => true,
            'licenseStatus' => [
                'valid' => true,
                'status' => 'active',
                'plan_name' => $license['plan_name'],
                'billing_cycle' => $license['billing_cycle'],
                'expiry_date' => $expiryDate,
                'max_stores' => $license['max_stores'] ?? 1,
                'max_users' => $license['max_users'] ?? 1,
                'max_devices' => $license['max_devices'] ?? 1,
                'days_left' => $daysLeft,
                'days_remaining' => $daysLeft,
                'hours_left' => $hoursLeft,
            ],
            'storeFeatures' => $features,
        ];
    }

    /**
     * Get cached system branding settings.
     */
    public static function getSystemBranding(): array
    {
        if (self::$brandingMemo !== null) {
            return self::$brandingMemo;
        }

        self::$brandingMemo = Cache::remember('system_branding_settings', 3600, function () {
            $systemBranding = [
                'platform_name' => config('app.name', 'Nasri Account System'),
                'system_logo' => '',
                'system_favicon' => '',
            ];

            try {
                $rows = SystemSetting::whereIn('setting_key', ['platform_name', 'system_logo', 'system_favicon'])
                    ->pluck('setting_value', 'setting_key');
                if (!empty($rows['platform_name'])) {
                    $systemBranding['platform_name'] = $rows['platform_name'];
                }
                if (!empty($rows['system_logo'])) {
                    $systemBranding['system_logo'] = $rows['system_logo'];
                }
                if (!empty($rows['system_favicon'])) {
                    $systemBranding['system_favicon'] = $rows['system_favicon'];
                }
            } catch (\Exception $e) {
                // Fallback to default config values if table not ready
            }

            return $systemBranding;
        });

        return self::$brandingMemo;
    }

    public static function clearUserAccess(?string $userId = null): void
    {
        if ($userId) {
            unset(self::$userAccessMemo[$userId]);
            Cache::forget("user_access_{$userId}");
        } else {
            self::$userAccessMemo = [];
        }
    }

    public static function clearStoreLicense(?string $storeId = null): void
    {
        if ($storeId) {
            unset(self::$storeLicenseMemo[$storeId]);
            Cache::forget("store_license_{$storeId}");
        } else {
            self::$storeLicenseMemo = [];
        }
    }

    public static function clearSystemBranding(): void
    {
        self::$brandingMemo = null;
        Cache::forget('system_branding_settings');
    }
}

