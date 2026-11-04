<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $indexesByTable = [
            'stores' => [
                ['columns' => ['owner_user_id'], 'name' => 'stores_owner_user_id_idx'],
                ['columns' => ['created_at'], 'name' => 'stores_created_at_idx'],
            ],
            'staff_accounts' => [
                ['columns' => ['store_id'], 'name' => 'staff_accounts_store_id_idx'],
                ['columns' => ['user_id', 'is_active'], 'name' => 'staff_accounts_user_active_idx'],
                ['columns' => ['store_id', 'user_id', 'is_active'], 'name' => 'staff_accounts_store_user_active_idx'],
                ['columns' => ['email', 'store_id', 'is_active'], 'name' => 'staff_accounts_email_store_active_idx'],
            ],
            'admin_roles' => [
                ['columns' => ['user_id', 'is_active'], 'name' => 'admin_roles_user_active_idx'],
            ],
            'items' => [
                ['columns' => ['store_id', 'category_id'], 'name' => 'items_store_category_idx'],
                ['columns' => ['store_id', 'sub_category_id'], 'name' => 'items_store_subcategory_idx'],
                ['columns' => ['barcode'], 'name' => 'items_barcode_idx'],
            ],
            'categories' => [
                ['columns' => ['store_id', 'created_at'], 'name' => 'categories_store_created_idx'],
                ['columns' => ['parent_id'], 'name' => 'categories_parent_id_idx'],
            ],
            'sales' => [
                ['columns' => ['store_id', 'sold_at'], 'name' => 'sales_store_sold_at_idx'],
                ['columns' => ['store_id', 'created_at'], 'name' => 'sales_store_created_at_idx'],
                ['columns' => ['store_id', 'status'], 'name' => 'sales_store_status_idx'],
                ['columns' => ['receipt_no'], 'name' => 'sales_receipt_no_idx'],
                ['columns' => ['staff_user_id'], 'name' => 'sales_staff_user_id_idx'],
                ['columns' => ['customer_id'], 'name' => 'sales_customer_id_idx'],
            ],
            'sale_items' => [
                ['columns' => ['sale_id'], 'name' => 'sale_items_sale_id_idx'],
                ['columns' => ['item_id'], 'name' => 'sale_items_item_id_idx'],
            ],
            'expenses' => [
                ['columns' => ['store_id', 'created_at'], 'name' => 'expenses_store_created_at_idx'],
                ['columns' => ['store_id', 'status'], 'name' => 'expenses_store_status_idx'],
                ['columns' => ['created_by'], 'name' => 'expenses_created_by_idx'],
                ['columns' => ['employee_user_id'], 'name' => 'expenses_employee_user_id_idx'],
                ['columns' => ['supplier_id'], 'name' => 'expenses_supplier_id_idx'],
            ],
            'payments' => [
                ['columns' => ['store_id', 'created_at'], 'name' => 'payments_store_created_at_idx'],
                ['columns' => ['sale_id'], 'name' => 'payments_sale_id_idx'],
                ['columns' => ['customer_id'], 'name' => 'payments_customer_id_idx'],
                ['columns' => ['reference'], 'name' => 'payments_reference_idx'],
                ['columns' => ['created_by'], 'name' => 'payments_created_by_idx'],
            ],
            'customer_debts' => [
                ['columns' => ['store_id', 'status'], 'name' => 'customer_debts_store_status_idx'],
                ['columns' => ['sale_id'], 'name' => 'customer_debts_sale_id_idx'],
                ['columns' => ['customer_id'], 'name' => 'customer_debts_customer_id_idx'],
            ],
            'returns' => [
                ['columns' => ['store_id', 'created_at'], 'name' => 'returns_store_created_at_idx'],
                ['columns' => ['sale_id'], 'name' => 'returns_sale_id_idx'],
                ['columns' => ['processed_by'], 'name' => 'returns_processed_by_idx'],
            ],
            'return_items' => [
                ['columns' => ['return_id'], 'name' => 'return_items_return_id_idx'],
                ['columns' => ['sale_item_id'], 'name' => 'return_items_sale_item_id_idx'],
                ['columns' => ['item_id'], 'name' => 'return_items_item_id_idx'],
            ],
            'purchases' => [
                ['columns' => ['store_id', 'created_at'], 'name' => 'purchases_store_created_at_idx'],
                ['columns' => ['store_id', 'status'], 'name' => 'purchases_store_status_idx'],
                ['columns' => ['supplier_id', 'status'], 'name' => 'purchases_supplier_status_idx'],
                ['columns' => ['reference_no'], 'name' => 'purchases_reference_no_idx'],
            ],
            'purchase_items' => [
                ['columns' => ['purchase_id'], 'name' => 'purchase_items_purchase_id_idx'],
                ['columns' => ['item_id'], 'name' => 'purchase_items_item_id_idx'],
            ],
            'account_transfers' => [
                ['columns' => ['store_id', 'created_at'], 'name' => 'account_transfers_store_created_idx'],
                ['columns' => ['reference'], 'name' => 'account_transfers_reference_idx'],
            ],
            'stock_transfers' => [
                ['columns' => ['source_store_id', 'created_at'], 'name' => 'stock_transfers_source_created_idx'],
                ['columns' => ['destination_store_id', 'created_at'], 'name' => 'stock_transfers_dest_created_idx'],
                ['columns' => ['status'], 'name' => 'stock_transfers_status_idx'],
            ],
            'payment_accounts' => [
                ['columns' => ['store_id', 'created_at'], 'name' => 'payment_accounts_store_created_idx'],
            ],
            'licenses' => [
                ['columns' => ['owner_user_id', 'status', 'expiry_date'], 'name' => 'licenses_owner_status_expiry_idx'],
                ['columns' => ['store_id', 'status'], 'name' => 'licenses_store_status_idx'],
                ['columns' => ['status'], 'name' => 'licenses_status_idx'],
            ],
            'platform_payments' => [
                ['columns' => ['store_id', 'status', 'created_at'], 'name' => 'platform_payments_store_status_idx'],
                ['columns' => ['reference_number'], 'name' => 'platform_payments_ref_num_idx'],
                ['columns' => ['status'], 'name' => 'platform_payments_status_idx'],
            ],
            'subscriptions' => [
                ['columns' => ['store_id', 'status'], 'name' => 'subscriptions_store_status_idx'],
                ['columns' => ['owner_user_id', 'status'], 'name' => 'subscriptions_owner_status_idx'],
            ],
            'support_tickets' => [
                ['columns' => ['store_id', 'status'], 'name' => 'support_tickets_store_status_idx'],
                ['columns' => ['status', 'created_at'], 'name' => 'support_tickets_status_created_idx'],
            ],
        ];

        foreach ($indexesByTable as $table => $indexDefs) {
            if (!Schema::hasTable($table)) {
                continue;
            }

            $existingIndexes = collect(DB::select("SHOW INDEX FROM `{$table}`"))
                ->pluck('Key_name')
                ->unique()
                ->all();

            foreach ($indexDefs as $def) {
                $indexName = $def['name'];
                $cols = $def['columns'];

                if (in_array($indexName, $existingIndexes, true)) {
                    continue;
                }

                $allColsExist = true;
                foreach ($cols as $col) {
                    if (!Schema::hasColumn($table, $col)) {
                        $allColsExist = false;
                        break;
                    }
                }

                if (!$allColsExist) {
                    continue;
                }

                try {
                    Schema::table($table, function (Blueprint $t) use ($cols, $indexName) {
                        $t->index($cols, $indexName);
                    });
                } catch (\Exception $e) {
                    // Ignore if already indexed under another constraint/index
                }
            }
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

