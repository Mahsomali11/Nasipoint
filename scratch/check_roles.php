<?php
// Bootstrap Laravel
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

// Boot the app
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

// Check admin_roles table
echo "=== admin_roles table columns ===\n";
try {
    $cols = Schema::getColumnListing('admin_roles');
    echo implode(', ', $cols) . "\n";
    echo "\n=== admin_roles rows ===\n";
    $rows = DB::table('admin_roles')->get();
    echo json_encode($rows, JSON_PRETTY_PRINT) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}

// Check users table columns
echo "\n=== users table columns ===\n";
$cols = Schema::getColumnListing('users');
echo implode(', ', $cols) . "\n";

// Check sample user
echo "\n=== Sample users ===\n";
$users = DB::table('users')->limit(3)->get(['id','email','role','name']);
echo json_encode($users, JSON_PRETTY_PRINT) . "\n";

// Check staff_accounts table
echo "\n=== staff_accounts table columns ===\n";
try {
    $cols = Schema::getColumnListing('staff_accounts');
    echo implode(', ', $cols) . "\n";
    $staff = DB::table('staff_accounts')->limit(3)->get();
    echo json_encode($staff, JSON_PRETTY_PRINT) . "\n";
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}
