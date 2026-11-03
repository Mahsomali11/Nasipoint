<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = \App\Models\User::where('email', 'superadmin@nasripoint.com')->first();
if (!$user) {
    die("User not found\n");
}

function testApi($kernel, $user, $uri) {
    $request = Illuminate\Http\Request::create($uri, 'GET');
    $request->setUserResolver(function() use ($user) { return $user; });
    $response = $kernel->handle($request);
    echo "--- $uri ---\n";
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content: " . substr($response->getContent(), 0, 150) . "\n\n";
}

testApi($kernel, $user, '/api/rest/v1/stores?count=exact&head=true');
testApi($kernel, $user, '/api/rest/v1/profiles?count=exact&head=true');
testApi($kernel, $user, '/api/rest/v1/licenses');
testApi($kernel, $user, '/api/rest/v1/sales?select=total');
testApi($kernel, $user, '/api/rest/v1/platform_payments?select=amount,status,created_at');
testApi($kernel, $user, '/api/rest/v1/stores?select=*,profiles!stores_owner_user_id_fkey(email,full_name)&order=created_at.desc&limit=5');
testApi($kernel, $user, '/api/rest/v1/stores?select=id,created_at');

