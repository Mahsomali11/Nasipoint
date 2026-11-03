<?php
require __DIR__ . '/../vendor/autoload.php';
$app = require_once __DIR__ . '/../bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

// List admin users
echo "=== Admin roles ===\n";
$admins = DB::table('admin_roles')->get();
foreach ($admins as $a) {
    $user = DB::table('users')->where('id', $a->user_id)->first(['id','email','name']);
    echo "Role: {$a->role} | User: " . ($user ? $user->email : 'NOT FOUND (user_id: '.$a->user_id.')') . "\n";
}

// Check if admin@nasripoint.com user exists and has admin_role
echo "\n=== Checking admin@nasripoint.com ===\n";
$adminUser = DB::table('users')->where('email', 'admin@nasripoint.com')->first(['id','email','name']);
if ($adminUser) {
    echo "Found: {$adminUser->email} (id: {$adminUser->id})\n";
    $role = DB::table('admin_roles')->where('user_id', $adminUser->id)->first();
    echo "Admin role: " . ($role ? $role->role : 'NONE') . "\n";
    
    // If no role, create one
    if (!$role) {
        DB::table('admin_roles')->insert([
            'id' => \Illuminate\Support\Str::uuid(),
            'user_id' => $adminUser->id,
            'role' => 'super_owner',
            'is_active' => true,
        ]);
        echo "Created super_owner role for admin@nasripoint.com\n";
    }
} else {
    echo "NOT FOUND\n";
}

// List all users with admin-like emails
echo "\n=== All users ===\n";
$users = DB::table('users')->get(['id','email','name']);
foreach ($users as $u) {
    $role = DB::table('admin_roles')->where('user_id', $u->id)->first();
    echo $u->email . " -> " . ($role ? "ADMIN: {$role->role}" : 'store user') . "\n";
}
