<?php

require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$sale = Illuminate\Support\Facades\DB::table('sales')->where('receipt_no', 'RCP-1789396351399')->first();
echo "Sale:\n";
print_r($sale);

if ($sale) {
    $payments = Illuminate\Support\Facades\DB::table('payments')->where('sale_id', $sale->id)->get();
    echo "\nPayments:\n";
    print_r($payments);
}
