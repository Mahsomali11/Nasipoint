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
            $table->string('category')->nullable()->change();
            // In case barcode is also empty string causing problems, we should ensure it's nullable
            $table->string('barcode')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('items', function (Blueprint $table) {
            if (!Schema::hasColumn('items', 'category')) {
                $table->string('category')->nullable(false)->change();
            }
            if (!Schema::hasColumn('items', 'barcode')) {
                $table->string('barcode')->nullable(false)->change();
            }
        });
    }
};
