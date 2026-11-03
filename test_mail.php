<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

try {
    \Illuminate\Support\Facades\Mail::raw('Test email', function ($message) {
        $message->to('support@nasripoint.com')->subject('Test SMTP Connection');
    });
    echo "SMTP Success: Email accepted by server.\n";
} catch (\Exception $e) {
    echo "SMTP Error: " . $e->getMessage() . "\n";
}
