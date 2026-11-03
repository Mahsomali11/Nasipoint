<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Schema\Blueprint;

Schema::table('sales', function (Blueprint $table) {
    if (!Schema::hasColumn('sales', 'payment_account_id')) {
        $table->foreignUuid('payment_account_id')->nullable()->constrained('payment_accounts')->nullOnDelete();
    }
});

Schema::table('expenses', function (Blueprint $table) {
    if (!Schema::hasColumn('expenses', 'payment_account_id')) {
        $table->foreignUuid('payment_account_id')->nullable()->constrained('payment_accounts')->nullOnDelete();
    }
});

echo "Done\n";
