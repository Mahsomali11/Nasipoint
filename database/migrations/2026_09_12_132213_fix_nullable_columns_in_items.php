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
        Schema::table('items', function (Blueprint $table) {
            if (!Schema::hasColumn('items', 'barcode')) {
                $table->string('barcode')->nullable()->change();
            }
            if (!Schema::hasColumn('items', 'item_code')) {
                $table->string('item_code')->nullable()->change();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            if (!Schema::hasColumn('items', 'barcode')) {
                $table->string('barcode')->default('')->change();
            }
            if (!Schema::hasColumn('items', 'item_code')) {
                $table->string('item_code')->default('')->change();
            }
        });
    }
};
