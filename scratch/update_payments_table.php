<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

if (Schema::hasTable('payments')) {
    Schema::table('payments', function (Blueprint $table) {
        if (!Schema::hasColumn('payments', 'payment_account_id')) {
            $table->uuid('payment_account_id')->nullable();
            $table->foreign('payment_account_id')->references('id')->on('payment_accounts')->onDelete('set null');
        }
    });
    echo "Added payment_account_id to payments table.\n";
} else {
    echo "payments table does not exist.\n";
}
