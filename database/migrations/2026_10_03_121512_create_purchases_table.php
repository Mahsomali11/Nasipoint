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
        Schema::create('purchases', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('store_id')->nullable()->constrained('stores')->cascadeOnDelete();
            $table->string('reference_no')->unique();
            $table->uuid('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->uuid('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->date('date');
            $table->decimal('total_amount', 15, 2)->default(0);
            $table->decimal('paid_amount', 15, 2)->default(0);
            $table->uuid('payment_account_id')->nullable()->constrained('payment_accounts')->nullOnDelete();
            $table->enum('status', ['pending', 'completed'])->default('completed');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('purchases');
    }
};
