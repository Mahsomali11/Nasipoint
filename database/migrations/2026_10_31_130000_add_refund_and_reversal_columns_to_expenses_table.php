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
        Schema::table('expenses', function (Blueprint $table) {
            if (!Schema::hasColumn('expenses', 'status')) {
                $table->string('status', 30)->default('active')->after('amount');
            }
            if (!Schema::hasColumn('expenses', 'refund_reason')) {
                $table->text('refund_reason')->nullable()->after('note');
            }
            if (!Schema::hasColumn('expenses', 'refund_amount')) {
                $table->decimal('refund_amount', 12, 2)->default(0)->after('amount');
            }
            if (!Schema::hasColumn('expenses', 'refunded_at')) {
                $table->timestamp('refunded_at')->nullable()->after('updated_at');
            }
            if (!Schema::hasColumn('expenses', 'refunded_by')) {
                $table->foreignUuid('refunded_by')->nullable()->constrained('users')->nullOnDelete()->after('created_by');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('expenses', function (Blueprint $table) {
            if (Schema::hasColumn('expenses', 'refunded_by')) {
                $table->dropForeign(['refunded_by']);
                $table->dropColumn('refunded_by');
            }
            $columnsToDrop = [];
            foreach (['status', 'refund_reason', 'refund_amount', 'refunded_at'] as $col) {
                if (Schema::hasColumn('expenses', $col)) {
                    $columnsToDrop[] = $col;
                }
            }
            if (!empty($columnsToDrop)) {
                $table->dropColumn($columnsToDrop);
            }
        });
    }
};
