<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use Illuminate\Support\Facades\Schema;

dump('plans:', Schema::getColumnListing('plans'));
dump('subscriptions:', Schema::getColumnListing('subscriptions'));
dump('licenses:', Schema::getColumnListing('licenses'));
