<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

$stores = DB::table('stores')->get();
echo "=== STORES ===\n";
foreach ($stores as $s) {
    $itemsCount = DB::table('items')->where('store_id', $s->id)->count();
    $owner = DB::table('users')->where('id', $s->owner_user_id)->first();
    echo "- '{$s->store_name}' (ID: {$s->id}) | Owner: " . ($owner->email ?? 'N/A') . " | Items: {$itemsCount}\n";
}
