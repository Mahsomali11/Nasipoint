<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
// Bootstrap the app
$kernel->handle(Illuminate\Http\Request::capture());

$user = App\Models\User::first();
$store = App\Models\Store::first();

if ($store && $user) {
    try {
        $item = App\Models\Item::create([
            'id' => (string) Illuminate\Support\Str::uuid(),
            'store_id' => $store->id,
            'item_code' => '#001',
            'name' => 'Test Item',
            'category' => 'Test Cat',
            'type' => 'product',
            'barcode' => '123456789',
            'cost_price' => 10,
            'sell_price' => 20,
            'quantity' => 5,
            'low_stock_threshold' => 5,
            'is_active' => true,
        ]);
        echo "Inserted item: " . $item->id . "\n";
    } catch (\Exception $e) {
        echo "Exception: " . $e->getMessage() . "\n";
    }
}
