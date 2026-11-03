<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('subscriptions')) {
            Schema::create('subscriptions', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('owner_user_id');
                $table->uuid('store_id');
                $table->uuid('plan_id');
                $table->string('status')->default('active');
                $table->timestamp('current_period_start')->nullable();
                $table->timestamp('current_period_end')->nullable();
                $table->boolean('cancel_at_period_end')->default(false);
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('platform_payments')) {
            Schema::create('platform_payments', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('store_id');
                $table->decimal('amount', 10, 2);
                $table->string('status');
                $table->string('payment_method')->nullable();
                $table->string('reference_number')->nullable();
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('support_tickets')) {
            Schema::create('support_tickets', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->uuid('store_id');
                $table->uuid('user_id');
                $table->string('subject');
                $table->text('description');
                $table->string('status')->default('open');
                $table->string('priority')->default('normal');
                $table->timestamps();
            });
        }

        if (!Schema::hasTable('system_settings')) {
            Schema::create('system_settings', function (Blueprint $table) {
                $table->uuid('id')->primary();
                $table->string('setting_key')->unique();
                $table->text('setting_value')->nullable();
                $table->string('description')->nullable();
                $table->timestamps();
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('subscriptions');
        Schema::dropIfExists('platform_payments');
        Schema::dropIfExists('support_tickets');
        Schema::dropIfExists('system_settings');
    }
};
