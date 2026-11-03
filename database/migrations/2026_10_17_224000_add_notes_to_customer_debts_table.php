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
        if (Schema::hasTable('customer_debts') && !Schema::hasColumn('customer_debts', 'notes')) {
            Schema::table('customer_debts', function (Blueprint $table) {
                $table->text('notes')->nullable()->after('status');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (Schema::hasTable('customer_debts') && Schema::hasColumn('customer_debts', 'notes')) {
            Schema::table('customer_debts', function (Blueprint $table) {
                $table->dropColumn('notes');
            });
        }
    }
};
