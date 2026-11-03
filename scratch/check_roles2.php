<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Check users table
echo "=== Sample users ===\n";
$users = DB::table('users')->limit(5)->get(['id','email','name']);
echo json_encode($users, JSON_PRETTY_PRINT) . "\n";

// Check staff_accounts table
echo "\n=== staff_accounts columns ===\n";
try {
    $cols = Schema::getColumnListing('staff_accounts');
    echo implode(', ', $cols) . "\n";
    $staff = DB::table('staff_accounts')->limit(3)->get();
    echo json_encode($staff, JSON_PRETTY_PRINT) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

// Check profiles table
echo "\n=== profiles columns ===\n";
try {
    $cols = Schema::getColumnListing('profiles');
    echo implode(', ', $cols) . "\n";
    $profiles = DB::table('profiles')->limit(3)->get(['id','email','full_name','role']);
    echo json_encode($profiles, JSON_PRETTY_PRINT) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

// Admin roles
echo "\n=== admin_roles ===\n";
$admins = DB::table('admin_roles')->get();
echo json_encode($admins, JSON_PRETTY_PRINT) . "\n";
