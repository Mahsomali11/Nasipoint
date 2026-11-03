<?php
require __DIR__.'/vendor/autoload.php';
$app = require_once __DIR__.'/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Http\Request;
use App\Http\Controllers\DynamicApiController;

$controller = new DynamicApiController();
$request = Request::create('/api/rest/v1/stores', 'GET', ['count' => 'exact', 'head' => 'true']);
$response = $controller->index($request, 'stores');
var_dump($response->headers->all());
