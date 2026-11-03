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
        Schema::table('staff_accounts', function (Blueprint $table) {
            if (!Schema::hasColumn('staff_accounts', 'user_id')) {
                $table->foreignUuid('user_id')->nullable()->constrained('users')->nullOnDelete()->after('id');
            }
        });

        // Backfill user_id based on email match
        DB::statement('
            UPDATE staff_accounts sa
            JOIN users u ON sa.email = u.email
            SET sa.user_id = u.id
            WHERE sa.user_id IS NULL
        ');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('staff_accounts', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }
};
