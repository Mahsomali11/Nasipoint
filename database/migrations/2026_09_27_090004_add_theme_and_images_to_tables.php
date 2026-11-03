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
            if (!Schema::hasColumn('stores', 'primary_color')) {
                $table->string('primary_color')->nullable();
            }
            if (!Schema::hasColumn('stores', 'secondary_color')) {
                $table->string('secondary_color')->nullable();
            }
        });

        Schema::table('items', function (Blueprint $table) {
            if (!Schema::hasColumn('items', 'image_path')) {
                $table->string('image_path')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stores', function (Blueprint $table) {
            $table->dropColumn(['primary_color', 'secondary_color']);
        });

        Schema::table('items', function (Blueprint $table) {
            $table->dropColumn('image_path');
        });
    }
};
