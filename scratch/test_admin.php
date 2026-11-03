<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$u = \App\Models\User::where('email', 'mahamedsomali15@gmail.com')->first();
if (!$u) {
    echo "User not found\n";
    exit;
}
echo "User ID: " . $u->id . "\n";
$role = \App\Models\AdminRole::where('user_id', $u->id)->first();
if ($role) {
    echo "Admin Role: " . $role->role . "\n";
} else {
    echo "No Admin Role\n";
}

$stores = \App\Models\Store::where('owner_user_id', $u->id)->get();
echo "Stores owned: " . $stores->count() . "\n";

// Test fetching sales for the store
foreach ($stores as $s) {
    echo "Store: " . $s->id . "\n";
    $salesCount = \App\Models\Sale::where('store_id', $s->id)->count();
    $itemsCount = \App\Models\Item::where('store_id', $s->id)->count();
    echo "Sales count: $salesCount\n";
    echo "Items count: $itemsCount\n";
}
