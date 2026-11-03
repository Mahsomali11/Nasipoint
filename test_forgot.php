<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$request = Illuminate\Http\Request::create('/forgot-password', 'POST', ['email' => 'test2@example.com']);
// Bypass CSRF for internal test by just calling controller method directly
$controller = new \App\Http\Controllers\WebAuthController();
$response = $controller->forgotPassword($request);

echo "Status: " . $response->getStatusCode() . "\n";
echo "Content: " . $response->getContent() . "\n";
