<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stores', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('owner_user_id')->constrained('users')->onDelete('cascade');
            $table->string('store_name');
            $table->string('store_code')->default('');
            $table->string('location')->default('');
            $table->string('phone')->default('');
            $table->string('currency')->default('KSh');
            $table->timestamps();
        });

        Schema::create('items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('item_code')->default('');
            $table->string('name');
            $table->string('type')->default('product');
            $table->string('barcode')->default('');
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('sell_price', 12, 2)->default(0);
            $table->integer('quantity')->default(0);
            $table->integer('low_stock_threshold')->default(5);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('customers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('customer_code')->default('');
            $table->string('name');
            $table->string('phone')->default('');
            $table->text('address')->nullable();
            $table->timestamps();
        });

        Schema::create('suppliers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('supplier_code')->default('');
            $table->string('name');
            $table->string('phone')->default('');
            $table->text('address')->nullable();
            $table->timestamps();
        });

        Schema::create('sales', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('receipt_no');
            $table->foreignUuid('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignUuid('staff_user_id')->constrained('users');
            $table->string('sale_type')->default('cash');
            $table->decimal('subtotal', 12, 2)->default(0);
            $table->decimal('discount', 12, 2)->default(0);
            $table->decimal('tax', 12, 2)->default(0);
            $table->decimal('total', 12, 2)->default(0);
            $table->decimal('paid_amount', 12, 2)->default(0);
            $table->decimal('outstanding_amount', 12, 2)->default(0);
            $table->string('status')->default('completed');
            $table->timestamp('sold_at')->useCurrent();
            $table->timestamps();
        });

        Schema::create('sale_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('sale_id')->constrained('sales')->onDelete('cascade');
            $table->foreignUuid('item_id')->constrained('items')->onDelete('cascade');
            $table->string('item_name')->default('');
            $table->integer('quantity')->default(1);
            $table->decimal('cost_price', 12, 2)->default(0);
            $table->decimal('sell_price', 12, 2)->default(0);
            $table->decimal('line_total', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('expenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('expense_type')->default('');
            $table->decimal('amount', 12, 2)->default(0);
            $table->text('note')->nullable();
            $table->foreignUuid('employee_user_id')->nullable()->constrained('users');
            $table->string('employee_name')->default('');
            $table->string('payment_method')->default('cash');
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignUuid('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->foreignUuid('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignUuid('supplier_id')->nullable()->constrained('suppliers')->nullOnDelete();
            $table->string('payment_type')->default('sale');
            $table->string('direction')->default('in');
            $table->string('method')->default('cash');
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('reference')->default('');
            $table->foreignUuid('created_by')->constrained('users');
            $table->timestamps();
        });

        Schema::create('customer_debts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignUuid('customer_id')->constrained('customers')->onDelete('cascade');
            $table->string('customer_name')->default('');
            $table->foreignUuid('sale_id')->nullable()->constrained('sales')->nullOnDelete();
            $table->decimal('original_amount', 12, 2)->default(0);
            $table->decimal('balance_amount', 12, 2)->default(0);
            $table->string('status')->default('open');
            $table->timestamps();
        });

        Schema::create('returns', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignUuid('sale_id')->constrained('sales')->onDelete('cascade');
            $table->foreignUuid('processed_by')->constrained('users');
            $table->string('refund_method')->default('cash');
            $table->decimal('refund_amount', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('return_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('return_id')->constrained('returns')->onDelete('cascade');
            $table->foreignUuid('sale_item_id')->constrained('sale_items')->onDelete('cascade');
            $table->foreignUuid('item_id')->constrained('items')->onDelete('cascade');
            $table->integer('quantity')->default(1);
            $table->decimal('amount', 12, 2)->default(0);
            $table->timestamps();
        });

        Schema::create('staff_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('full_name');
            $table->string('email')->default('');
            $table->string('phone')->default('');
            $table->string('role')->default('cashier');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('cash_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->date('business_date');
            $table->decimal('opening_cash', 12, 2)->default(0);
            $table->decimal('closing_cash', 12, 2)->default(0);
            $table->foreignUuid('opened_by')->constrained('users');
            $table->foreignUuid('closed_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        Schema::create('cash_movements', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignUuid('cash_session_id')->constrained('cash_sessions')->onDelete('cascade');
            $table->string('movement_type')->default('');
            $table->string('direction')->default('in');
            $table->decimal('amount', 12, 2)->default(0);
            $table->string('source_module')->default('');
            $table->string('reference_id')->default('');
            $table->text('note')->nullable();
            $table->timestamps();
        });

        Schema::create('stock_transfers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('source_store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignUuid('destination_store_id')->constrained('stores')->onDelete('cascade');
            $table->string('status')->default('pending');
            $table->foreignUuid('requested_by')->constrained('users');
            $table->foreignUuid('approved_by')->nullable()->constrained('users');
            $table->foreignUuid('received_by')->nullable()->constrained('users');
            $table->timestamps();
        });

        Schema::create('stock_transfer_items', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('stock_transfer_id')->constrained('stock_transfers')->onDelete('cascade');
            $table->foreignUuid('item_id')->constrained('items')->onDelete('cascade');
            $table->integer('quantity')->default(1);
            $table->timestamps();
        });

        Schema::create('admin_roles', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->string('role');
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('plans', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('name');
            $table->integer('max_users')->default(0);
            $table->integer('max_devices')->default(0);
            $table->decimal('price', 12, 2)->default(0);
            $table->string('duration')->default('monthly');
            $table->json('features')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        Schema::create('licenses', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('license_key');
            $table->foreignUuid('owner_user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('store_id')->nullable()->constrained('stores')->onDelete('cascade');
            $table->foreignUuid('plan_id')->constrained('plans')->onDelete('cascade');
            $table->integer('max_users')->default(0);
            $table->integer('max_devices')->default(0);
            $table->timestamp('start_date')->nullable();
            $table->timestamp('expiry_date')->nullable();
            $table->string('status')->default('active');
            $table->json('features_enabled')->nullable();
            $table->timestamps();
        });

        Schema::create('license_extensions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('license_id')->constrained('licenses')->onDelete('cascade');
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('old_expiry_date');
            $table->string('new_expiry_date');
            $table->string('status');
            $table->timestamp('activation_time')->nullable();
            $table->foreignUuid('admin_id')->constrained('users')->onDelete('cascade');
            $table->timestamp('activated_at')->nullable();
            $table->timestamp('cancelled_at')->nullable();
            $table->timestamps();
        });
        
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('action');
            $table->foreignUuid('admin_user_id')->constrained('users')->onDelete('cascade');
            $table->string('entity_type');
            $table->uuid('entity_id')->nullable();
            $table->json('details')->nullable();
            $table->timestamps();
        });
        
        Schema::create('device_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('user_id')->constrained('users')->onDelete('cascade');
            $table->foreignUuid('store_id')->nullable()->constrained('stores')->onDelete('cascade');
            $table->string('device_id');
            $table->string('device_name')->default('');
            $table->string('device_type')->default('');
            $table->string('status')->default('active');
            $table->timestamp('last_login')->useCurrent();
            $table->timestamps();
        });

        Schema::create('payment_accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('account_name');
            $table->string('account_number')->nullable();
            $table->string('provider_name')->nullable();
            $table->string('account_type')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
        
        Schema::create('payment_integrations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->string('provider_name')->nullable();
            $table->string('consumer_key')->nullable();
            $table->string('consumer_secret_encrypted')->nullable();
            $table->string('passkey_encrypted')->nullable();
            $table->string('shortcode')->nullable();
            $table->string('initiator_name')->nullable();
            $table->string('security_credential_encrypted')->nullable();
            $table->string('callback_url')->nullable();
            $table->string('validation_url')->nullable();
            $table->string('confirmation_url')->nullable();
            $table->string('environment')->nullable();
            $table->boolean('is_enabled')->default(false);
            $table->string('status')->nullable();
            $table->timestamp('last_tested_at')->nullable();
            $table->timestamps();
        });
        
        Schema::create('payment_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignUuid('store_id')->constrained('stores')->onDelete('cascade');
            $table->foreignUuid('plan_id')->constrained('plans')->onDelete('cascade');
            $table->string('amount');
            $table->string('phone_number')->nullable();
            $table->string('payment_method')->nullable();
            $table->string('billing_cycle')->nullable();
            $table->string('status')->nullable();
            $table->string('checkout_request_id')->nullable();
            $table->string('expired_reason')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamps();
        });
        
        Schema::create('exchange_rates', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->string('currency_code');
            $table->string('currency_name')->nullable();
            $table->string('currency_symbol')->nullable();
            $table->decimal('rate_to_usd', 12, 4)->default(1);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('exchange_rates');
        Schema::dropIfExists('payment_sessions');
        Schema::dropIfExists('payment_integrations');
        Schema::dropIfExists('payment_accounts');
        Schema::dropIfExists('device_sessions');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('license_extensions');
        Schema::dropIfExists('licenses');
        Schema::dropIfExists('plans');
        Schema::dropIfExists('admin_roles');
        Schema::dropIfExists('stock_transfer_items');
        Schema::dropIfExists('stock_transfers');
        Schema::dropIfExists('cash_movements');
        Schema::dropIfExists('cash_sessions');
        Schema::dropIfExists('staff_accounts');
        Schema::dropIfExists('return_items');
        Schema::dropIfExists('returns');
        Schema::dropIfExists('customer_debts');
        Schema::dropIfExists('payments');
        Schema::dropIfExists('expenses');
        Schema::dropIfExists('sale_items');
        Schema::dropIfExists('sales');
        Schema::dropIfExists('suppliers');
        Schema::dropIfExists('customers');
        Schema::dropIfExists('items');
        Schema::dropIfExists('stores');
    }
};
