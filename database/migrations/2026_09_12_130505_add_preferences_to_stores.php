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
        Schema::table('stores', function (Blueprint $table) {
            if (!Schema::hasColumn('stores', 'tax_enabled')) {
                $table->boolean('tax_enabled')->default(false);
            }
            if (!Schema::hasColumn('stores', 'low_stock_threshold')) {
                $table->integer('low_stock_threshold')->default(5);
            }
            if (!Schema::hasColumn('stores', 'receipt_footer')) {
                $table->string('receipt_footer')->nullable()->default('Thank you for shopping with us!');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['tax_enabled', 'low_stock_threshold', 'receipt_footer']);
        });
    }
};
