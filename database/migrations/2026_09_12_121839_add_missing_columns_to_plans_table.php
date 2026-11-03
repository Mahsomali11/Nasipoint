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
        Schema::table('plans', function (Blueprint $table) {
            if (!Schema::hasColumn('plans', 'monthly_price')) {
                $table->decimal('monthly_price', 12, 2)->default(0)->after('price');
            }
            if (!Schema::hasColumn('plans', 'yearly_price')) {
                $table->decimal('yearly_price', 12, 2)->default(0)->after('monthly_price');
            }
            if (!Schema::hasColumn('plans', 'max_stores')) {
                $table->integer('max_stores')->default(1)->after('max_devices');
            }
            if (!Schema::hasColumn('plans', 'storage_limit')) {
                $table->integer('storage_limit')->default(1)->after('max_stores');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('plans', function (Blueprint $table) {
            $table->dropColumn(['monthly_price', 'yearly_price', 'max_stores', 'storage_limit']);
        });
    }
};
