<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Http\Kernel::class);

$user = \App\Models\User::where('email', 'mahamedsomali15@gmail.com')->first();
if (!$user) {
    die("User not found\n");
}

function testApi($kernel, $user, $uri, $method = 'GET', $body = []) {
    $request = Illuminate\Http\Request::create($uri, $method, $body);
    $request->setUserResolver(function() use ($user) { return $user; });
    $response = $kernel->handle($request);
    echo "--- $method $uri ---\n";
    echo "Status: " . $response->getStatusCode() . "\n";
    echo "Content: " . substr($response->getContent(), 0, 150) . "\n\n";
}

$storeId = '01a09566-448c-7075-bd19-ef317d35572e';

testApi($kernel, $user, '/api/rest/v1/profiles?id=eq.'.$user->id);
testApi($kernel, $user, '/api/rest/v1/stores?owner_user_id=eq.'.$user->id);
testApi($kernel, $user, '/api/rest/v1/items?store_id=eq.'.$storeId);
testApi($kernel, $user, '/api/rest/v1/returns?store_id=eq.'.$storeId);
testApi($kernel, $user, '/api/rest/v1/sales?store_id=eq.'.$storeId);
testApi($kernel, $user, '/api/rest/v1/admin_roles?user_id=eq.'.$user->id);

