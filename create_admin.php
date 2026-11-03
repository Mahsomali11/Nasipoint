<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

$u = User::create([
    'email' => 'superadmin@nasripoint.com', 
    'password' => Hash::make('password'), 
    'name' => 'Super Admin', 
    'full_name' => 'Super Admin', 
    'phone' => '123456789'
]); 

DB::table('admin_roles')->insert([
    'id' => (string) \Illuminate\Support\Str::uuid(),
    'user_id' => $u->id, 
    'role' => 'super_owner', 
    'is_active' => true
]); 

echo "Created admin user: admin@nasripoint.com\n";
