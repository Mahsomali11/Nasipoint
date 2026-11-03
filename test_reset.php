<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use Illuminate\Support\Facades\Password;

try {
    $status = Password::broker()->sendResetLink(['email' => 'support@nasripoint.com']);
    echo "Password Reset Status: " . __($status) . "\n";
} catch (\Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
