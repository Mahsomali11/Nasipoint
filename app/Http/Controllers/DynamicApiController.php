<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DynamicApiController extends Controller
{
    protected function getModelClass($table)
    {
        // Special cases
        if ($table === 'returns') return '\\App\\Models\\ReturnModel';
        if ($table === 'profiles') return '\\App\\Models\\User'; // Use users table for profiles
        
        $modelName = Str::studly(Str::singular($table));
        $class = '\\App\\Models\\' . $modelName;
        
        if (class_exists($class)) {
            return $class;
        }
        
        abort(404, "Model for table {$table} not found.");
    }

    public function index(Request $request, $table)
    {
        if ($table === 'licenses') {
            try {
                $todayStr = now()->format('Y-m-d');
                \Illuminate\Support\Facades\DB::table('licenses')
                    ->where('status', '!=', 'suspended')
                    ->whereNotNull('expiry_date')
                    ->where('expiry_date', '>=', $todayStr)
                    ->where('status', '!=', 'active')
                    ->update(['status' => 'active']);
                \Illuminate\Support\Facades\DB::table('licenses')
                    ->where('status', 'active')
                    ->whereNotNull('expiry_date')
                    ->where('expiry_date', '<', $todayStr)
                    ->update(['status' => 'expired']);
            } catch (\Throwable $e) {
            }
        }

        $class = $this->getModelClass($table);
        $query = $class::query();

        $selectParam = $request->query('select', '*');
        
        // Handle relations in select e.g. "*, profiles!stores_owner_user_id_fkey(email, full_name)"
        if ($selectParam && $selectParam !== '*') {
            $relations = [];
            $selects = [];
            
            // We need a better split that doesn't split inside parentheses
            $parts = preg_split('/,\s*(?![^\(\)]*\))/', $selectParam);
            
            foreach ($parts as $part) {
                $part = trim($part);
                if ($part === '*' || $part === '') continue;
                
                if (preg_match('/^([a-zA-Z0-9_]+)(?:![^\(]+|:[^\(]+)?\((.*?)\)$/', $part, $matches)) {
                    $relation = $matches[1];
                    $cols = $matches[2];
                    $relations[$relation] = $cols;
                } else {
                    $selects[] = $part;
                }
            }
            
            if (!empty($selects)) {
                $query->select($selects);
            }
            
            foreach ($relations as $rel => $cols) {
                $query->with([$rel => function ($q) use ($cols) {
                    if ($cols && $cols !== '*') {
                        // Map columns, making sure we include the primary key 'id' for relation mapping
                        $colArr = array_map('trim', explode(',', $cols));
                        if (!in_array('id', $colArr)) {
                            $colArr[] = 'id';
                        }
                        $q->select($colArr);
                    }
                }]);
            }
        }

        // Apply filters from query params
        foreach ($request->all() as $key => $value) {
            if (in_array($key, ['select', 'order', 'limit', 'or', 'count', 'head'])) continue;
            
            // Format: field=eq.value
            if (is_string($value)) {
                $parsedValue = $value;
                $operator = '=';
                $isWhereIn = false;
                $inItems = [];
                
                if (str_starts_with($value, 'eq.')) {
                    $parsedValue = substr($value, 3);
                } elseif (str_starts_with($value, 'neq.')) {
                    $parsedValue = substr($value, 4);
                    $operator = '!=';
                } elseif (str_starts_with($value, 'in.')) {
                    $inItems = explode(',', trim(substr($value, 3), '()'));
                    $isWhereIn = true;
                }

                // Handle boolean strings
                if ($parsedValue === 'true') $parsedValue = true;
                if ($parsedValue === 'false') $parsedValue = false;
                if ($parsedValue === 'null') $parsedValue = null;

                if ($isWhereIn) {
                    $query->whereIn($key, $inItems);
                } else {
                    $query->where($key, $operator, $parsedValue);
                }
            }
        }

        if ($request->has('or')) {
            $orStr = $request->query('or');
            $parts = explode(',', $orStr);
            $query->where(function ($q) use ($parts) {
                foreach ($parts as $part) {
                    if (str_contains($part, '.eq.')) {
                        [$field, $val] = explode('.eq.', $part);
                        if ($val === 'true') $val = true;
                        if ($val === 'false') $val = false;
                        if ($val === 'null') $val = null;
                        $q->orWhere($field, $val);
                    }
                }
            });
        }

        if ($request->has('order')) {
            $orderParts = explode('.', $request->query('order'));
            $field = $orderParts[0];
            $direction = $orderParts[1] ?? 'asc';
            $query->orderBy($field, $direction);
        }

        $count = null;
        if ($request->has('count') && $request->query('count') === 'exact') {
            $count = $query->count();
            if ($request->has('head') && $request->query('head') === 'true') {
                return response()->json([], 200, ['Content-Range' => "0-0/$count"]);
            }
        }

        if ($request->has('limit')) {
            $query->limit($request->query('limit'));
        }

        $headers = [];
        if ($count !== null) {
            $headers['Content-Range'] = "0-0/$count";
        }

        return response()->json($query->get(), 200, $headers);
    }

    public function store(Request $request, $table)
    {
        if (in_array($table, ['licenses', 'plans', 'admin_roles', 'system_settings', 'license_extension_logs'], true)) {
            $user = $request->user() ?? auth()->user();
            $access = $user ? \App\Support\AccessCache::getUserAccess($user) : ['is_admin' => false];
            if (empty($access['is_admin'])) {
                return response()->json(['error' => 'Forbidden: Only Platform Super Admins can modify platform administration resources.'], 403);
            }
        }

        $class = $this->getModelClass($table);

        // Use only JSON body data, or fallback to POST
        $body = $request->json()->all();
        if (empty($body)) {
            $body = $request->post();
        }

        // Strict backend store creation quota enforcement against active subscription/license plan
        if ($table === 'stores') {
            $user = $request->user() ?? auth()->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthenticated.'], 401);
            }

            $targetOwnerId = !empty($body['owner_user_id']) ? (string) $body['owner_user_id'] : (string) $user->id;
            $access = \App\Support\AccessCache::getUserAccess($user);
            $isPlatformAdmin = !empty($access['is_admin']);

            if (!$isPlatformAdmin && $targetOwnerId !== (string) $user->id) {
                return response()->json(['error' => 'Forbidden: You can only create stores for your own account.'], 403);
            }

            $isStaffOnly = !$isPlatformAdmin && empty($access['is_any_owner']) && !empty($access['staff_roles_by_store']);
            $quota = \App\Support\AccessCache::evaluateUserStoreQuota(
                $targetOwnerId,
                null,
                $isPlatformAdmin && $targetOwnerId === (string) $user->id,
                $isStaffOnly
            );

            if (!$quota['can_create_store']) {
                $reason = $quota['reason'] ?? 'You have reached the maximum number of stores allowed by your subscription plan.';
                return response()->json([
                    'error' => $reason,
                    'message' => $reason,
                ], 403);
            }
        }
        
        if (in_array($table, ['stores', 'staff_accounts', 'licenses', 'plans', 'system_settings', 'admin_roles'], true)) {
            \Illuminate\Support\Facades\Cache::flush();
        }

        // Strict email validation when creating staff_accounts, profiles, or users
        if (in_array($table, ['staff_accounts', 'profiles', 'users'], true) && isset($body['email'])) {
            $email = strtolower(trim((string) $body['email']));
            $body['email'] = $email;
            $validator = \Illuminate\Support\Facades\Validator::make(
                ['email' => $email],
                ['email' => WebAuthController::strictEmailRules(false)]
            );
            if ($validator->fails()) {
                $msg = $validator->errors()->first('email') ?: 'Please enter a valid email address (e.g. name@example.com).';
                return response()->json(['error' => $msg, 'message' => $msg], 422);
            }
        }

        // Normalize and validate items payload (single or bulk) so missing store_id or empty optional fields never crash
        if ($table === 'items') {
            $user = $request->user() ?? auth()->user();
            $fallbackStoreId = $request->input('store_id');
            if ((!$fallbackStoreId || trim((string) $fallbackStoreId) === '') && $user) {
                $access = \App\Support\AccessCache::getUserAccess($user);
                $fallbackStoreId = $access['assigned_store_id'] ?? ($access['owned_store_ids'][0] ?? null);
                if (!$fallbackStoreId) {
                    $fallbackStoreId = \App\Models\Store::where('owner_user_id', $user->id)->value('id')
                        ?? \App\Models\StaffAccount::where('user_id', $user->id)->where('is_active', true)->value('store_id');
                }
            }

            $normalizeItemRow = function (array $row, int $offset = 0) use ($fallbackStoreId): array {
                $storeId = trim((string) ($row['store_id'] ?? $fallbackStoreId ?? ''));
                $name = trim((string) ($row['name'] ?? ''));
                $type = in_array($row['type'] ?? '', ['product', 'service'], true) ? $row['type'] : 'product';
                $subCatId = !empty($row['sub_category_id']) && trim((string) $row['sub_category_id']) !== ''
                    ? trim((string) $row['sub_category_id'])
                    : null;
                $itemCode = trim((string) ($row['item_code'] ?? ''));
                if ($itemCode === '' && $storeId !== '') {
                    $count = \App\Models\Item::where('store_id', $storeId)->count() + 1 + $offset;
                    $itemCode = '#' . str_pad((string) $count, 3, '0', STR_PAD_LEFT);
                }

                $row['store_id'] = $storeId;
                $row['name'] = $name;
                $row['item_code'] = $itemCode;
                $row['type'] = $type;
                $row['category'] = trim((string) ($row['category'] ?? ''));
                $row['sub_category_id'] = $subCatId;
                $row['barcode'] = trim((string) ($row['barcode'] ?? ''));
                $row['cost_price'] = is_numeric($row['cost_price'] ?? null) ? max(0, (float) $row['cost_price']) : 0;
                $row['sell_price'] = is_numeric($row['sell_price'] ?? null) ? max(0, (float) $row['sell_price']) : 0;
                $row['quantity'] = $type === 'service' ? 0 : (is_numeric($row['quantity'] ?? null) ? (int) round((float) $row['quantity']) : 0);
                $row['low_stock_threshold'] = is_numeric($row['low_stock_threshold'] ?? null) ? max(0, (int) round((float) $row['low_stock_threshold'])) : 5;
                $row['is_active'] = isset($row['is_active']) ? (bool) $row['is_active'] : true;
                if (array_key_exists('image_path', $row)) {
                    $row['image_path'] = (string) ($row['image_path'] ?? '');
                }

                return $row;
            };

            if (is_array($body) && isset($body[0]) && is_array($body[0])) {
                foreach ($body as $idx => $itemRow) {
                    $normalized = $normalizeItemRow($itemRow, $idx);
                    if ($normalized['store_id'] === '') {
                        return response()->json(['error' => 'Active store context is required to add items.', 'message' => 'Active store context is required to add items.'], 422);
                    }
                    if ($normalized['name'] === '') {
                        return response()->json(['error' => 'Item name is required.', 'message' => 'Item name is required.'], 422);
                    }
                    $body[$idx] = $normalized;
                }
            } elseif (is_array($body)) {
                $body = $normalizeItemRow($body, 0);
                if ($body['store_id'] === '') {
                    return response()->json(['error' => 'Active store context is required to add an item.', 'message' => 'Active store context is required to add an item.'], 422);
                }
                if ($body['name'] === '') {
                    return response()->json(['error' => 'Item name is required.', 'message' => 'Item name is required.'], 422);
                }
            }
        }

        if (is_array($body) && isset($body[0]) && is_array($body[0])) {
            // Check for rapid duplicate bulk insert (e.g. sale_items for the same sale)
            if ($table === 'sale_items' && isset($body[0]['sale_id'])) {
                $existingCount = \Illuminate\Support\Facades\DB::table('sale_items')->where('sale_id', $body[0]['sale_id'])->count();
                if ($existingCount > 0) {
                    \Illuminate\Support\Facades\Log::info("DynamicAPI Deduplicated duplicate sale_items insert for sale: " . $body[0]['sale_id']);
                    return response()->json($body, 201);
                }
            }

            // Bulk insert (array of objects)
            $data = $body;
            $now = now()->format('Y-m-d H:i:s');
            foreach ($data as &$item) {
                if (!isset($item['id']) || empty($item['id'])) {
                    $item['id'] = (string) Str::uuid();
                }
                if (!isset($item['created_at']) || empty($item['created_at'])) {
                    $item['created_at'] = $now;
                } else {
                    try {
                        $item['created_at'] = \Carbon\Carbon::parse($item['created_at'])->format('Y-m-d H:i:s');
                    } catch (\Exception $e) {
                        $item['created_at'] = $now;
                    }
                }
                if (!isset($item['updated_at']) || empty($item['updated_at'])) {
                    $item['updated_at'] = $now;
                } else {
                    try {
                        $item['updated_at'] = \Carbon\Carbon::parse($item['updated_at'])->format('Y-m-d H:i:s');
                    } catch (\Exception $e) {
                        $item['updated_at'] = $now;
                    }
                }
            }
            try {
                $class::insert($data);
                return response()->json($data, 201);
            } catch (\Exception $e) {
                \Illuminate\Support\Facades\Log::error("DynamicAPI Bulk Insert Error: " . $e->getMessage());
                return response()->json(['error' => $e->getMessage()], 500);
            }
        }

        // Rapid duplicate checks (within 2 seconds) for single transaction records
        if ($table === 'sales' && isset($body['store_id'], $body['total'])) {
            $recentSale = \App\Models\Sale::where('store_id', $body['store_id'])
                ->where('total', $body['total'])
                ->where('created_at', '>=', now()->subSeconds(2))
                ->first();
            if ($recentSale) {
                \Illuminate\Support\Facades\Log::info("DynamicAPI Deduplicated duplicate sale insert for store: {$body['store_id']}");
                return response()->json($recentSale, 201);
            }
        }

        if ($table === 'payments' && isset($body['store_id'], $body['amount'])) {
            $paymentQuery = \App\Models\Payment::where('store_id', $body['store_id'])
                ->where('amount', $body['amount'])
                ->where('created_at', '>=', now()->subSeconds(2));
            if (!empty($body['sale_id'])) {
                $paymentQuery->where('sale_id', $body['sale_id']);
            }
            if (!empty($body['customer_id'])) {
                $paymentQuery->where('customer_id', $body['customer_id']);
            }
            $recentPayment = $paymentQuery->first();
            if ($recentPayment) {
                \Illuminate\Support\Facades\Log::info("DynamicAPI Deduplicated duplicate payment insert for store: {$body['store_id']}");
                return response()->json($recentPayment, 201);
            }
        }

        if ($table === 'expenses' && isset($body['store_id'], $body['amount'])) {
            $expenseQuery = \App\Models\Expense::where('store_id', $body['store_id'])
                ->where('amount', $body['amount'])
                ->where('created_at', '>=', now()->subSeconds(2));
            if (!empty($body['expense_type'])) {
                $expenseQuery->where('expense_type', $body['expense_type']);
            }
            $recentExpense = $expenseQuery->first();
            if ($recentExpense) {
                \Illuminate\Support\Facades\Log::info("DynamicAPI Deduplicated duplicate expense insert for store: {$body['store_id']}");
                return response()->json($recentExpense, 201);
            }
        }

        if ($table === 'customer_debts' && isset($body['store_id'], $body['customer_id'], $body['original_amount'])) {
            $debtQuery = \App\Models\CustomerDebt::where('store_id', $body['store_id'])
                ->where('customer_id', $body['customer_id'])
                ->where('original_amount', $body['original_amount'])
                ->where('created_at', '>=', now()->subSeconds(2));
            if (!empty($body['sale_id'])) {
                $debtQuery->where('sale_id', $body['sale_id']);
            }
            $recentDebt = $debtQuery->first();
            if ($recentDebt) {
                \Illuminate\Support\Facades\Log::info("DynamicAPI Deduplicated duplicate customer_debt insert for store: {$body['store_id']}");
                return response()->json($recentDebt, 201);
            }
        }

        // Single insert
        if (!isset($body['id']) || empty($body['id'])) {
            $body['id'] = (string) Str::uuid();
        }
        if (isset($body['created_at']) && !empty($body['created_at'])) {
            try {
                $body['created_at'] = \Carbon\Carbon::parse($body['created_at'])->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                unset($body['created_at']);
            }
        }
        if (isset($body['updated_at']) && !empty($body['updated_at'])) {
            try {
                $body['updated_at'] = \Carbon\Carbon::parse($body['updated_at'])->format('Y-m-d H:i:s');
            } catch (\Exception $e) {
                unset($body['updated_at']);
            }
        }
        try {
            $record = $class::create($body);
            return response()->json($record, 201);
        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error("DynamicAPI Insert Error: " . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function show($table, $id)
    {
        $class = $this->getModelClass($table);
        return response()->json($class::findOrFail($id));
    }

    public function update(Request $request, $table, $id = null)
    {
        if (in_array($table, ['licenses', 'plans', 'admin_roles', 'system_settings', 'license_extension_logs'], true)) {
            $user = $request->user() ?? auth()->user();
            $access = $user ? \App\Support\AccessCache::getUserAccess($user) : ['is_admin' => false];
            if (empty($access['is_admin'])) {
                return response()->json(['error' => 'Forbidden: Only Platform Super Admins can modify platform administration resources.'], 403);
            }
        }

        $class = $this->getModelClass($table);

        if ($table === 'expenses') {
            $user = $request->user() ?? auth()->user();
            $access = $user ? \App\Support\AccessCache::getUserAccess($user) : ['is_admin' => false, 'is_any_owner' => false];
            if (!$access['is_admin'] && !$access['is_any_owner']) {
                return response()->json(['error' => 'Forbidden: Only Store Owners and Admins are permitted to edit expenses.'], 403);
            }
        }

        // Prevent logged-in user from modifying their own staff_accounts row (role/self-modification lockout protection)
        if ($table === 'staff_accounts') {
            $user = $request->user() ?? auth()->user();
            if ($user) {
                $targetId = $id;
                if (!$targetId) {
                    $eqId = $request->query('id');
                    if (is_string($eqId) && str_starts_with($eqId, 'eq.')) {
                        $targetId = substr($eqId, 3);
                    }
                }
                if ($targetId) {
                    $targetStaff = \App\Models\StaffAccount::find($targetId);
                    if ($targetStaff && (
                        (!empty($targetStaff->user_id) && (string) $targetStaff->user_id === (string) $user->id) ||
                        (!empty($targetStaff->email) && !empty($user->email) && strtolower(trim($targetStaff->email)) === strtolower(trim($user->email)))
                    )) {
                        return response()->json(['error' => 'Forbidden: You cannot modify your own staff account.'], 403);
                    }
                }
            }
        }

        // Use only JSON body data, or fallback to POST
        $body = $request->json()->all();
        if (empty($body)) {
            $body = $request->post();
        }

        // Strict email validation when updating staff_accounts, profiles, or users
        if (in_array($table, ['staff_accounts', 'profiles', 'users'], true) && isset($body['email'])) {
            $email = strtolower(trim((string) $body['email']));
            $body['email'] = $email;
            $validator = \Illuminate\Support\Facades\Validator::make(
                ['email' => $email],
                ['email' => WebAuthController::strictEmailRules(false)]
            );
            if ($validator->fails()) {
                $msg = $validator->errors()->first('email') ?: 'Please enter a valid email address (e.g. name@example.com).';
                return response()->json(['error' => $msg, 'message' => $msg], 422);
            }
        }

        // Normalize item fields on update
        if ($table === 'items' && is_array($body)) {
            if (array_key_exists('sub_category_id', $body) && empty($body['sub_category_id'])) {
                $body['sub_category_id'] = null;
            }
            if (isset($body['cost_price'])) {
                $body['cost_price'] = is_numeric($body['cost_price']) ? max(0, (float) $body['cost_price']) : 0;
            }
            if (isset($body['sell_price'])) {
                $body['sell_price'] = is_numeric($body['sell_price']) ? max(0, (float) $body['sell_price']) : 0;
            }
            if (isset($body['quantity'])) {
                $body['quantity'] = is_numeric($body['quantity']) ? (int) round((float) $body['quantity']) : 0;
            }
            if (isset($body['low_stock_threshold'])) {
                $body['low_stock_threshold'] = is_numeric($body['low_stock_threshold']) ? max(0, (int) round((float) $body['low_stock_threshold'])) : 5;
            }
        }

        // Requirement: When extending a license (or setting an expiry_date >= today), automatically activate status
        if ($table === 'licenses' && !empty($body['expiry_date'])) {
            try {
                $expiresAt = \Carbon\Carbon::parse($body['expiry_date'])->startOfDay();
                $daysLeft = (int) ceil(($expiresAt->getTimestamp() - now()->getTimestamp()) / 86400);
                if ($daysLeft >= 0) {
                    $body['status'] = 'active';
                }
            } catch (\Throwable $e) {
            }
        }

        if ($id) {
            $record = $class::findOrFail($id);
            $record->update($body);
            
            if ($table === 'plans' && isset($body['features'])) {
                $featuresJson = is_array($body['features']) ? json_encode($body['features']) : $body['features'];
                \Illuminate\Support\Facades\DB::table('licenses')
                    ->where('plan_id', $id)
                    ->update(['features_enabled' => $featuresJson]);
            }

            if (in_array($table, ['stores', 'staff_accounts', 'licenses', 'subscriptions', 'plans', 'system_settings', 'admin_roles'], true)) {
                \App\Support\AccessCache::clearStoreLicense();
                \App\Support\AccessCache::clearUserAccess();
                \Illuminate\Support\Facades\Cache::flush();
            }
            
            return response()->json($record);
        }
        
        $query = $class::query();
        $filtered = false;
        foreach ($request->query() as $key => $value) {
            if (in_array($key, ['select', 'order', 'limit', 'count', 'head'])) continue;
            if (is_string($value) && str_starts_with($value, 'eq.')) {
                $val = substr($value, 3);
                if ($val === 'true') $val = true;
                if ($val === 'false') $val = false;
                if ($val === 'null') $val = null;
                $query->where($key, $val);
                $filtered = true;
            }
        }
        
        if ($filtered) {
            $query->update($body);
            
            if ($table === 'plans' && isset($body['features'])) {
                $planId = null;
                foreach ($request->query() as $key => $value) {
                    if ($key === 'id' && is_string($value) && str_starts_with($value, 'eq.')) {
                        $planId = substr($value, 3);
                        break;
                    }
                }
                if ($planId) {
                    $featuresJson = is_array($body['features']) ? json_encode($body['features']) : $body['features'];
                    \Illuminate\Support\Facades\DB::table('licenses')
                        ->where('plan_id', $planId)
                        ->update(['features_enabled' => $featuresJson]);
                }
            }

            if (in_array($table, ['stores', 'staff_accounts', 'licenses', 'subscriptions', 'plans', 'system_settings', 'admin_roles'], true)) {
                \App\Support\AccessCache::clearStoreLicense();
                \App\Support\AccessCache::clearUserAccess();
                \Illuminate\Support\Facades\Cache::flush();
            }
            
            return response()->json(['success' => true]);
        }
        
        return response()->json(['error' => 'Missing ID or filter for update'], 400);
    }

    public function destroy(Request $request, $table, $id = null)
    {
        $class = $this->getModelClass($table);

        if ($table === 'licenses') {
            $user = $request->user() ?? auth()->user();
            $access = $user ? \App\Support\AccessCache::getUserAccess($user) : ['is_admin' => false, 'admin_role' => null];
            if (!$access['is_admin'] || !in_array($access['admin_role'], ['super_owner', 'superadmin'], true)) {
                return response()->json(['error' => 'Forbidden: Only Super Admins are permitted to delete licenses.'], 403);
            }
        }

        if ($table === 'expenses') {
            $user = $request->user() ?? auth()->user();
            $access = $user ? \App\Support\AccessCache::getUserAccess($user) : ['is_admin' => false, 'is_any_owner' => false];
            if (!$access['is_admin'] && !$access['is_any_owner']) {
                return response()->json(['error' => 'Forbidden: Only Store Owners and Admins are permitted to delete expenses.'], 403);
            }
        }

        // Prevent logged-in user from deleting their own staff_accounts row (self-deletion lockout protection)
        if ($table === 'staff_accounts') {
            $user = $request->user() ?? auth()->user();
            if ($user) {
                $targetId = $id;
                if (!$targetId) {
                    $eqId = $request->query('id');
                    if (is_string($eqId) && str_starts_with($eqId, 'eq.')) {
                        $targetId = substr($eqId, 3);
                    }
                }
                if ($targetId) {
                    $targetStaff = \App\Models\StaffAccount::find($targetId);
                    if ($targetStaff && (
                        (!empty($targetStaff->user_id) && (string) $targetStaff->user_id === (string) $user->id) ||
                        (!empty($targetStaff->email) && !empty($user->email) && strtolower(trim($targetStaff->email)) === strtolower(trim($user->email)))
                    )) {
                        return response()->json(['error' => 'Forbidden: You cannot delete your own staff account.'], 403);
                    }
                }
            }
        }
        
        if ($id) {
            $record = $class::findOrFail($id);
            $record->delete();
            if (in_array($table, ['stores', 'staff_accounts', 'licenses', 'subscriptions', 'plans', 'system_settings', 'admin_roles'], true)) {
                \App\Support\AccessCache::clearStoreLicense();
                \App\Support\AccessCache::clearUserAccess();
                \Illuminate\Support\Facades\Cache::flush();
            }
            return response()->json(null, 204);
        }
        
        $query = $class::query();
        $filtered = false;
        foreach ($request->query() as $key => $value) {
            if (is_string($value) && str_starts_with($value, 'eq.')) {
                $val = substr($value, 3);
                if ($val === 'true') $val = true;
                if ($val === 'false') $val = false;
                if ($val === 'null') $val = null;
                $query->where($key, $val);
                $filtered = true;
            } elseif (is_string($value) && str_starts_with($value, 'in.')) {
                $items = explode(',', trim(substr($value, 3), '()'));
                $query->whereIn($key, $items);
                $filtered = true;
            }
        }
        
        if ($filtered) {
            $query->delete();
            if (in_array($table, ['stores', 'staff_accounts', 'licenses', 'subscriptions', 'plans', 'system_settings', 'admin_roles'], true)) {
                \App\Support\AccessCache::clearStoreLicense();
                \App\Support\AccessCache::clearUserAccess();
                \Illuminate\Support\Facades\Cache::flush();
            }
            return response()->json(null, 204);
        }
        
        return response()->json(['error' => 'Missing ID or filter for delete'], 400);
    }
}
