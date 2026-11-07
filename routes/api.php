<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Http\Controllers\DynamicApiController;
use App\Http\Controllers\AuthController;
use App\Http\Middleware\AdminMiddleware;

// ============================================================
// PUBLIC API AUTH ROUTES — No authentication required
// ============================================================

// Normal user API login (token-based, for mobile/external clients)
Route::post('/login', [AuthController::class, 'login']);
Route::post('/signup', [AuthController::class, 'signup']);
Route::post('/auth/v1/signup-with-store', [AuthController::class, 'signupWithStore']);
Route::post('/auth/v1/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');

// Public endpoint to retrieve system-wide branding (name, logo, favicon)
Route::get('/system-branding', function () {
    return response()->json(\App\Support\AccessCache::getSystemBranding());
});

// ============================================================
// AUTHENTICATED USER API ROUTES
// ============================================================

Route::middleware(['auth:sanctum'])->group(function () {

    // Returns current user profile + computed role (cached)
    Route::get('/user', function (Request $request) {
        $user = $request->user();
        $access = \App\Support\AccessCache::getUserAccess($user);
        $isPlatformAdmin = !empty($access['is_admin']);
        $role = $isPlatformAdmin ? 'super_admin' : ($access['role'] ?? 'staff');

        return array_merge($user->only(['id', 'name', 'full_name', 'email', 'phone', 'created_at']), [
            'role'              => $role,
            'store_role'        => $isPlatformAdmin ? null : ($access['role'] ?? null),
            'admin_role'        => $isPlatformAdmin ? $access['admin_role'] : null,
            'is_platform_admin' => $isPlatformAdmin,
            'assigned_store_id' => $isPlatformAdmin ? null : $access['assigned_store_id'],
            'email'             => $user->email,
            'full_name'         => $user->full_name ?? $user->name,
            'stores'            => $isPlatformAdmin ? [] : ($access['stores'] ?? []),
        ]);
    });

    // Create staff user
    Route::post('/auth/v1/create-staff', [AuthController::class, 'createStaff']);
    Route::post('/auth/v1/update-staff-password', [AuthController::class, 'updateStaffPassword']);

    // Process Return, Purchase, Transfers, and Expense Reversals
    Route::post('/rest/v1/process-return', [\App\Http\Controllers\ReturnController::class, 'processReturn']);
    Route::post('/rest/v1/process-purchase', [\App\Http\Controllers\PurchaseController::class, 'processPurchase']);
    Route::post('/rest/v1/pay-supplier-debt', [\App\Http\Controllers\PurchaseController::class, 'paySupplierDebt']);
    Route::post('/rest/v1/process-transfer', [\App\Http\Controllers\TransferController::class, 'processTransfer']);
    Route::post('/rest/v1/refund-expense', [\App\Http\Controllers\ExpenseController::class, 'refundExpense']);
    Route::post('/rest/v1/expenses/{id}/refund', [\App\Http\Controllers\ExpenseController::class, 'refundExpense']);
    Route::patch('/rest/v1/expenses/{id}', [\App\Http\Controllers\ExpenseController::class, 'update']);
    Route::delete('/rest/v1/expenses/{id}', [\App\Http\Controllers\ExpenseController::class, 'destroy']);
    // Receipt Details Lookup (by ID, receipt_no RCP-..., or customer debt)
    Route::get('/rest/v1/receipt-details/{identifier}', [\App\Http\Controllers\SaleController::class, 'getReceiptDetails']);
    Route::get('/receipt-details/{identifier}', [\App\Http\Controllers\SaleController::class, 'getReceiptDetails']);

    // Dynamic REST API — protected by store access check for normal users
    // Admin users bypass store scoping (they can access all data)
    Route::middleware([
        \App\Http\Middleware\CheckStoreAccess::class,
        \App\Http\Middleware\CheckFeatureAccess::class
    ])->group(function () {
        
        // Fast optimized endpoint to get all store data, license status, features, and payment accounts in one request
        Route::post('/rest/v1/rpc/get_store_data', function (Request $request) {
            $storeId = $request->input('_store_id') ?? $request->input('store_id');
            if (!$storeId) return response()->json(['error' => 'Store ID is required'], 400);

            // Fetch only lightweight or necessary historical data (limit to recent 500 to prevent bloat)
            $recentSales = \App\Models\Sale::where('store_id', $storeId)->orderBy('sold_at', 'desc')->take(500)->get();
            $recentSalesIds = $recentSales->pluck('id');

            $recentPurchases = \App\Models\Purchase::where('store_id', $storeId)->orderBy('created_at', 'desc')->take(200)->get();
            $recentPurchaseIds = $recentPurchases->pluck('id');

            $evaluatedLicense = \App\Support\AccessCache::evaluateStoreLicense((string) $storeId);

            return response()->json([
                'items' => \App\Models\Item::with(['subCategory'])->where('store_id', $storeId)->get(),
                'customers' => \App\Models\Customer::where('store_id', $storeId)->get(),
                'suppliers' => \App\Models\Supplier::where('store_id', $storeId)->get(),
                'expenses' => \App\Models\Expense::with(['user:id,name,full_name', 'refunder:id,name,full_name'])->where('store_id', $storeId)->orderBy('created_at', 'desc')->take(500)->get(),
                'sales' => $recentSales,
                'saleItems' => $recentSalesIds->isNotEmpty()
                    ? \App\Models\SaleItem::whereIn('sale_id', $recentSalesIds)->get()
                    : [],
                'customerDebts' => \App\Models\CustomerDebt::where('store_id', $storeId)->get(),
                'payments' => \App\Models\Payment::with('user:id,name,full_name')->where('store_id', $storeId)->orderBy('created_at', 'desc')->take(500)->get(),
                'returns' => \App\Models\ReturnModel::where('store_id', $storeId)->orderBy('created_at', 'desc')->take(200)->get(),
                'staffAccounts' => \App\Models\StaffAccount::where('store_id', $storeId)->get(),
                'stockTransfers' => \App\Models\StockTransfer::where(function($q) use ($storeId) {
                    $q->where('source_store_id', $storeId)->orWhere('destination_store_id', $storeId);
                })->orderBy('created_at', 'desc')->take(200)->get(),
                'categories' => \App\Models\Category::where('store_id', $storeId)->orderBy('created_at', 'asc')->get(),
                'purchases' => $recentPurchases,
                'purchaseItems' => $recentPurchaseIds->isNotEmpty()
                    ? \App\Models\PurchaseItem::whereIn('purchase_id', $recentPurchaseIds)->get()
                    : [],
                'accountTransfers' => \App\Models\AccountTransfer::where('store_id', $storeId)->orderBy('created_at', 'desc')->take(200)->get(),
                'paymentAccounts' => \App\Models\PaymentAccount::where('store_id', $storeId)->orderBy('created_at', 'asc')->get(),
                'licenseStatus' => $evaluatedLicense['licenseStatus'],
                'storeFeatures' => $evaluatedLicense['storeFeatures'],
            ]);
        });

        Route::get('/rest/v1/{table}', [DynamicApiController::class, 'index']);
        Route::post('/rest/v1/{table}', [DynamicApiController::class, 'store']);
        Route::patch('/rest/v1/{table}', [DynamicApiController::class, 'update']);
        Route::delete('/rest/v1/{table}', [DynamicApiController::class, 'destroy']);
        
        Route::post('/upload-image', function (Request $request) {
            $request->validate([
                'image' => 'required|file|max:350',
                'folder' => 'required|string|in:store-logos,product-images,system-branding',
            ], [
                'image.max' => 'Image size must not exceed 350KB.',
                'image.uploaded' => 'Image size must not exceed 350KB.',
            ]);
            
            $file = $request->file('image');
            if ($file->getSize() > 350000) {
                return response()->json([
                    'message' => 'Image size must not exceed 350KB.',
                    'errors' => ['image' => ['Image size must not exceed 350KB.']],
                ], 422);
            }

            $ext = strtolower($file->getClientOriginalExtension());
            if (!in_array($ext, ['jpeg', 'png', 'jpg', 'svg', 'webp', 'ico'])) {
                return response()->json(['message' => 'Only PNG, JPG, JPEG, WEBP, SVG, or ICO files are allowed.'], 422);
            }

            $folder = $request->input('folder');
            
            // Create a unique filename
            $filename = uniqid() . '_' . time() . '.' . $ext;
            
            // Move directly to public/uploads folder to avoid storage symlink issues on shared hosting
            $targetDir = public_path('uploads/' . $folder);
            if (!is_dir($targetDir)) {
                mkdir($targetDir, 0755, true);
            }
            $file->move($targetDir, $filename);
            
            // Use relative path for URL so it works regardless of APP_URL config
            $path = 'uploads/' . $folder . '/' . $filename;
            
            return response()->json([
                'path' => $path,
                'url' => '/' . $path
            ]);
        });

        Route::post('/system-branding', function (Request $request) {
            $user = $request->user();
            $access = $user ? \App\Support\AccessCache::getUserAccess($user) : ['is_admin' => false];
            if (empty($access['is_admin'])) {
                return response()->json(['error' => 'Forbidden: Only Platform Super Admins can modify system branding.'], 403);
            }

            $descriptions = [
                'platform_name' => 'Official system name displayed across headers, sidebars, and titles',
                'system_logo' => 'System logo URL displayed on the sidebar and header',
                'system_favicon' => 'Web icon (favicon) URL displayed in the browser tab',
            ];

            foreach (['platform_name', 'system_logo', 'system_favicon'] as $key) {
                if ($request->has($key)) {
                    $existing = \App\Models\SystemSetting::where('setting_key', $key)->first();
                    if ($existing) {
                        $existing->update([
                            'setting_value' => (string) ($request->input($key) ?? ''),
                        ]);
                    } else {
                        \App\Models\SystemSetting::create([
                            'id' => (string) \Illuminate\Support\Str::uuid(),
                            'setting_key' => $key,
                            'setting_value' => (string) ($request->input($key) ?? ''),
                            'description' => $descriptions[$key],
                        ]);
                    }
                }
            }

            \App\Support\AccessCache::clearSystemBranding();
            return response()->json(\App\Support\AccessCache::getSystemBranding());
        });
    });

    // Diagnostic route
    Route::get('/test-data', function (Request $request) {
        $user = $request->user();
        return response()->json([
            'user'   => $user,
            'stores' => \App\Models\Store::where('owner_user_id', $user->id)->get(),
        ]);
    });
});
