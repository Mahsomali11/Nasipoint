<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

$columns = Illuminate\Support\Facades\Schema::getColumnListing('sales');
print_r($columns);

$store = App\Models\Store::first();
echo "Store: " . $store->id . "\n";
