<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);
$kernel->handle(Illuminate\Http\Request::capture());

$request = Illuminate\Http\Request::create('/api/rest/v1/items', 'POST', [], [], [], ['CONTENT_TYPE' => 'application/json'], json_encode([
    'store_id' => '123',
    'name' => 'Test Item',
]));

print_r($request->json()->all());


