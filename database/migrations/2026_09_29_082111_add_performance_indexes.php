<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = [
            'items', 'sales', 'expenses', 'payments', 'customers', 
            'suppliers', 'customer_debts', 'stock_transfers', 'returns', 'sale_items', 'categories'
        ];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $t) use ($table) {
                // We use raw queries or try/catch for indexes because Laravel's hasIndex is complex
                // A safe way is to just create them if they don't exist by catching exceptions
                $columns = ['store_id', 'payment_account_id', 'created_at', 'status'];
                
                // Note: Not all tables have all these columns, we must check if the column exists first
                foreach ($columns as $col) {
                    if (Schema::hasColumn($table, $col)) {
                        $indexName = $table . '_' . $col . '_index';
                        // Check if index exists via raw query
                        $indexExists = collect(\Illuminate\Support\Facades\DB::select("SHOW INDEX FROM `{$table}` WHERE Key_name = '{$indexName}'"))->count() > 0;
                        if (!$indexExists) {
                            try {
                                $t->index($col, $indexName);
                            } catch (\Exception $e) {
                                // Ignore if it already exists or fails
                            }
                        }
                    }
                }
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // 
    }
};
