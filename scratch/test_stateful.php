<?php
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8000/sanctum/csrf-cookie");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
$response = curl_exec($ch);
curl_close($ch);

preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $response, $matches);
$cookies = array();
foreach($matches[1] as $item) {
    parse_str($item, $cookie);
    $cookies = array_merge($cookies, $cookie);
}
$xsrfToken = $cookies['XSRF-TOKEN'] ?? '';
$laravelSession = $cookies['laravel_session'] ?? '';
$cookieString = "XSRF-TOKEN=$xsrfToken; laravel_session=$laravelSession";

echo "CSRF: $xsrfToken\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8000/login");
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'email' => 'mahamedsomali15@gmail.com',
    'password' => 'password',
    '_token' => urldecode($xsrfToken)
]));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HEADER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Cookie: $cookieString",
    "Referer: http://localhost:8000/login"
]);
$response = curl_exec($ch);
curl_close($ch);

preg_match_all('/^Set-Cookie:\s*([^;]*)/mi', $response, $matches);
foreach($matches[1] as $item) {
    parse_str($item, $cookie);
    $cookies = array_merge($cookies, $cookie);
}
$laravelSession = $cookies['laravel_session'] ?? '';
$cookieString = "XSRF-TOKEN=$xsrfToken; laravel_session=$laravelSession";

echo "Login Response Headers:\n";
echo substr($response, 0, strpos($response, "\r\n\r\n")) . "\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8000/api/user");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Cookie: $cookieString",
    "Referer: http://localhost:8000/dashboard",
    "Accept: application/json"
]);
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "\nAPI User HTTP Code: $httpcode\n";
echo "API User Response: $response\n";

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, "http://localhost:8000/api/rest/v1/stores?owner_user_id=eq.01a09566-446d-729b-bd2b-96474b4f37f1");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Cookie: $cookieString",
    "Referer: http://localhost:8000/dashboard",
    "Accept: application/json"
]);
$response = curl_exec($ch);
$httpcode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "\nAPI Stores HTTP Code: $httpcode\n";
echo "API Stores Response: $response\n";

