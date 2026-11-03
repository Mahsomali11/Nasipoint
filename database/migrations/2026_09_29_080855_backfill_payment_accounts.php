<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Add payment_account_id to payments table first
        Schema::table('payments', function (Blueprint $table) {
            if (!Schema::hasColumn('payments', 'payment_account_id')) {
                $table->foreignUuid('payment_account_id')->nullable()->constrained('payment_accounts')->nullOnDelete();
            }
        });

        // Fetch all payment accounts
        $accounts = DB::table('payment_accounts')->get();

        foreach ($accounts as $account) {
            DB::table('expenses')
                ->whereNull('payment_account_id')
                ->whereRaw('LOWER(payment_method) = ?', [strtolower($account->account_name)])
                ->update(['payment_account_id' => $account->id]);

            DB::table('payments')
                ->whereNull('payment_account_id')
                ->whereRaw('LOWER(method) = ?', [strtolower($account->account_name)])
                ->update(['payment_account_id' => $account->id]);
        }

        // Default fallback for legacy strings to account names
        $defaultMappings = [
            'cash' => 'Cash',
            'merchant' => 'Merchant',
            'mpesa' => 'Mobile Money',
            'mobile money' => 'Mobile Money',
            'card' => 'Bank',
            'bank' => 'Bank'
        ];

        $stores = DB::table('stores')->get();
        foreach ($stores as $store) {
            foreach ($defaultMappings as $legacyMethod => $targetAccountName) {
                $targetAccount = DB::table('payment_accounts')
                    ->where('store_id', $store->id)
                    ->whereRaw('LOWER(account_name) LIKE ?', ['%' . strtolower($targetAccountName) . '%'])
                    ->first();

                if ($targetAccount) {
                    DB::table('expenses')
                        ->where('store_id', $store->id)
                        ->whereNull('payment_account_id')
                        ->whereRaw('LOWER(payment_method) = ?', [strtolower($legacyMethod)])
                        ->update(['payment_account_id' => $targetAccount->id]);

                    DB::table('payments')
                        ->where('store_id', $store->id)
                        ->whereNull('payment_account_id')
                        ->whereRaw('LOWER(method) = ?', [strtolower($legacyMethod)])
                        ->update(['payment_account_id' => $targetAccount->id]);
                }
            }
        }

        // Sync sales with their corresponding payments
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
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // No down migration required for data backfill
    }
};
