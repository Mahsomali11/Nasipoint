<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// ============================================================
// PUBLIC ROUTES — No authentication required
// ============================================================

Route::get('/', function () {
    return redirect()->route('login');
});

Route::get('/test-login', function () {
    $credentials = ['email' => 'asxaabteyda@gmail.com', 'password' => 'password123'];
    if (Auth::attempt($credentials)) {
        $request = Request::create('/dashboard', 'GET');
        $request->headers->set('X-Inertia', 'true');
        $response = app()->handle($request);
        return response($response->getContent(), $response->status());
    }
    return "Login Failed";
});

Route::middleware('guest')->group(function () {
    // Normal User Login
    Route::get('/login', function () {
        return Inertia::render('LoginPage');
    })->name('login');

    Route::post('/login', [\App\Http\Controllers\WebAuthController::class, 'login']);

    // Normal User Signup
    Route::get('/signup', function () {
        return Inertia::render('SignupPage');
    })->name('signup');

    Route::post('/signup', [\App\Http\Controllers\WebAuthController::class, 'signup']);
    Route::post('/signup-with-store', [\App\Http\Controllers\WebAuthController::class, 'signupWithStore']);

    // Other public pages
    Route::post('/forgot-password', [\App\Http\Controllers\WebAuthController::class, 'forgotPassword']);
    Route::post('/reset-password', [\App\Http\Controllers\WebAuthController::class, 'resetPassword']);
    Route::get('/reset-password', fn() => Inertia::render('ResetPasswordPage'))->name('password.reset');
});

Route::get('/license-blocked', fn() => Inertia::render('LicenseBlockPage'));

// Logout (works for both, clears session)
Route::post('/logout', [\App\Http\Controllers\WebAuthController::class, 'logout'])->name('logout');

// ============================================================
// ADMIN ROUTES — Requires auth + admin_roles entry
// ============================================================

Route::middleware('guest')->group(function () {
    // Admin Login page (public — not protected)
    Route::get('/admin/login', function () {
        return Inertia::render('admin/AdminLoginPage');
    })->name('admin.login');

    // Admin Login POST — handled by WebAuthController
    Route::post('/admin/login', [\App\Http\Controllers\WebAuthController::class, 'adminLogin'])->name('admin.login.post');
});

// Admin Logout
Route::post('/admin/logout', [\App\Http\Controllers\WebAuthController::class, 'adminLogout'])->name('admin.logout');

// All /admin/* pages — protected by AdminMiddleware
Route::prefix('admin')->middleware(['auth', 'admin'])->group(function () {
    Route::get('/dashboard', fn() => Inertia::render('admin/AdminDashboardPage'))->name('admin.dashboard');
    Route::get('/stores', fn() => Inertia::render('admin/AdminStoresPage'));
    Route::get('/licenses', fn() => Inertia::render('admin/AdminLicensesPage'));
    Route::get('/subscriptions', fn() => Inertia::render('admin/AdminSubscriptionsPage'));
    Route::get('/payments', fn() => Inertia::render('admin/AdminPaymentsPage'));
    Route::get('/users', fn() => Inertia::render('admin/AdminUsersPage'));
    Route::get('/plans', fn() => Inertia::render('admin/AdminPlansPage'));
    Route::get('/analytics', fn() => Inertia::render('admin/AdminAnalyticsPage'));
    Route::get('/support', fn() => Inertia::render('admin/AdminSupportPage'));
    Route::get('/settings', fn() => Inertia::render('admin/AdminSettingsPage'));
    Route::get('/exchange-rates', fn() => Inertia::render('admin/AdminExchangeRatesPage'));
    Route::get('/mpesa-settings', fn() => Inertia::render('admin/AdminMpesaSettingsPage'));
});

// ============================================================
// NORMAL USER ROUTES — Requires auth, blocks admin users
// ============================================================

Route::middleware(['auth', 'block_admin'])->group(function () {
    Route::get('/dashboard', fn() => Inertia::render('DashboardPage'))->name('dashboard');
    Route::get('/start-sale', fn() => Inertia::render('StartSalePage'));
    Route::get('/customer-display', fn() => Inertia::render('CustomerDisplayPage'));
    Route::get('/receipt/{saleId}', fn($saleId) => Inertia::render('ReceiptPage', ['saleId' => $saleId]));
    Route::get('/api/receipt-details/{identifier}', [\App\Http\Controllers\SaleController::class, 'getReceiptDetails']);
    Route::get('/api/rest/v1/receipt-details/{identifier}', [\App\Http\Controllers\SaleController::class, 'getReceiptDetails']);
    Route::get('/expenses', fn() => Inertia::render('ExpensesPage'));
    Route::get('/cash-flow', fn() => Inertia::render('CashFlowPage'));
    Route::get('/credit-record', fn() => Inertia::render('CreditRecordPage'));
    Route::get('/returns', fn() => Inertia::render('ReturnsPage'));
    Route::get('/inventory', fn() => Inertia::render('InventoryPage'));
    Route::get('/categories', fn() => Inertia::render('CategoriesPage'));
    Route::get('/sales-report', fn() => Inertia::render('SalesReportPage'));
    Route::get('/customers', fn() => Inertia::render('CustomersPage'));
    Route::get('/suppliers', fn() => Inertia::render('SuppliersPage'));
    Route::get('/purchases', fn() => Inertia::render('PurchasesPage'));
    Route::get('/receipt-history', fn() => Inertia::render('ReceiptHistoryPage'));
    Route::get('/stock-transfers', fn() => Inertia::render('StockTransfersPage'));
    Route::get('/staff-accounts', fn() => Inertia::render('StaffAccountsPage'));
    Route::get('/stock-report', fn() => Inertia::render('StockReportPage'));
    Route::get('/payment-accounts', fn() => Inertia::render('PaymentAccountsPage'));
    Route::get('/store-edit', fn() => Inertia::render('StoreEditPage'));
    Route::get('/profile', fn() => Inertia::render('ProfilePage'));
    Route::get('/preferences', fn() => Inertia::render('PreferencesPage'));
    Route::get('/help', fn() => Inertia::render('HelpPage'));
    Route::get('/learning-center', fn() => Inertia::render('LearningCenterPage'));
    Route::get('/devices', fn() => Inertia::render('DeviceManagementPage'));
    Route::get('/upgrade', fn() => Inertia::render('UpgradePage'));
    Route::get('/create-store', fn() => Inertia::render('CreateStorePage'));
    Route::get('/setup-wizard', fn() => Inertia::render('SetupWizardPage'));
    Route::get('/select-store', fn() => Inertia::render('SelectStorePage'));
});

// ============================================================
// FALLBACK — 404 page
// ============================================================
Route::get('/{any}', function () {
    return Inertia::render('NotFound');
})->where('any', '.*');
