<?php
require __DIR__ . '/../vendor/autoload.php';

$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$features = DB::select("SELECT prosrc FROM pg_proc WHERE proname = 'get_store_features'");
echo json_encode($features);
