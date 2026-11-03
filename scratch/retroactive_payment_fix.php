<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// Fetch all payment accounts
$accounts = DB::table('payment_accounts')->get();
$fixedSales = 0;
$fixedPayments = 0;
$fixedExpenses = 0;

foreach ($accounts as $account) {
    // 1. Update expenses
    $updatedExpenses = DB::table('expenses')
        ->whereNull('payment_account_id')
        ->whereRaw('LOWER(payment_method) = ?', [strtolower($account->account_name)])
        ->update(['payment_account_id' => $account->id]);
    $fixedExpenses += $updatedExpenses;

    // 2. Update payments
    $updatedPayments = DB::table('payments')
        ->whereNull('payment_account_id')
        ->whereRaw('LOWER(method) = ?', [strtolower($account->account_name)])
        ->update(['payment_account_id' => $account->id]);
    $fixedPayments += $updatedPayments;
}

// Default fallback for legacy "cash", "mpesa", "card" etc. where account name might differ slightly
$defaultMappings = [
    'cash' => 'Cash',
    'mpesa' => 'Mobile Money',
    'card' => 'Bank',
    'bank' => 'Bank'
];

foreach ($defaultMappings as $legacyMethod => $targetAccountName) {
    // Find the target account per store?
    // Since accounts are per-store, we should loop through stores.
    $stores = DB::table('stores')->get();
    foreach ($stores as $store) {
        $targetAccount = DB::table('payment_accounts')
            ->where('store_id', $store->id)
            ->whereRaw('LOWER(account_name) LIKE ?', ['%' . strtolower($targetAccountName) . '%'])
            ->first();

        if ($targetAccount) {
            $updatedExpenses = DB::table('expenses')
                ->where('store_id', $store->id)
                ->whereNull('payment_account_id')
                ->whereRaw('LOWER(payment_method) = ?', [strtolower($legacyMethod)])
                ->update(['payment_account_id' => $targetAccount->id]);
            $fixedExpenses += $updatedExpenses;

            $updatedPayments = DB::table('payments')
                ->where('store_id', $store->id)
                ->whereNull('payment_account_id')
                ->whereRaw('LOWER(method) = ?', [strtolower($legacyMethod)])
                ->update(['payment_account_id' => $targetAccount->id]);
            $fixedPayments += $updatedPayments;
        }
    }
}

// 3. Sync sales with their corresponding payments
$salesToSync = DB::table('sales')
    ->whereNull('sales.payment_account_id')
    ->join('payments', 'sales.id', '=', 'payments.sale_id')
    ->whereNotNull('payments.payment_account_id')
    ->select('sales.id as sale_id', 'payments.payment_account_id')
    ->get();

foreach ($salesToSync as $sale) {
    DB::table('sales')
        ->where('id', $sale->sale_id)
        ->update(['payment_account_id' => $sale->payment_account_id]);
    $fixedSales++;
}

echo "Retroactive fix completed.\n";
echo "Fixed Expenses: $fixedExpenses\n";
echo "Fixed Payments: $fixedPayments\n";
echo "Fixed Sales: $fixedSales\n";
