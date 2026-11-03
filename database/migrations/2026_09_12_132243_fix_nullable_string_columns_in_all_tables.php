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
        // Fix stores
        Schema::table('stores', function (Blueprint $table) {
            if (!Schema::hasColumn('stores', 'store_code')) {
                $table->string('store_code')->nullable()->change();
            }
            if (!Schema::hasColumn('stores', 'location')) {
                $table->string('location')->nullable()->change();
            }
            if (!Schema::hasColumn('stores', 'phone')) {
                $table->string('phone')->nullable()->change();
            }
        });

        // Fix suppliers
        Schema::table('suppliers', function (Blueprint $table) {
            if (!Schema::hasColumn('suppliers', 'supplier_code')) {
                $table->string('supplier_code')->nullable()->change();
            }
            if (!Schema::hasColumn('suppliers', 'phone')) {
                $table->string('phone')->nullable()->change();
            }
        });

        // Fix customers
        Schema::table('customers', function (Blueprint $table) {
            if (!Schema::hasColumn('customers', 'customer_code')) {
                $table->string('customer_code')->nullable()->change();
            }
            if (!Schema::hasColumn('customers', 'phone')) {
                $table->string('phone')->nullable()->change();
            }
        });

        // Fix staff_accounts
        Schema::table('staff_accounts', function (Blueprint $table) {
            if (!Schema::hasColumn('staff_accounts', 'phone')) {
                $table->string('phone')->nullable()->change();
            }
        });
    }

    public function down(): void
    {
        // No need to revert - nullable is safer
    }
};
