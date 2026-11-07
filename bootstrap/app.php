<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

$app = Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);
        $middleware->api(append: [
            \App\Http\Middleware\PreventDuplicateSubmissions::class,
        ]);
        $middleware->api(remove: [
            \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
        ]);
        
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);

        $middleware->redirectUsersTo(function (\Illuminate\Http\Request $request) {
            $user = $request->user();
            if ($user) {
                $access = \App\Support\AccessCache::getUserAccess($user);
                if (!empty($access['is_admin'])) {
                    return '/admin/dashboard';
                }
            }
            return '/dashboard';
        });

        $middleware->redirectGuestsTo(function (\Illuminate\Http\Request $request) {
            if ($request->is('admin') || $request->is('admin/*')) {
                return '/admin/login';
            }
            return '/login';
        });

        // Named middleware aliases
        $middleware->alias([
            'admin' => \App\Http\Middleware\AdminMiddleware::class,
            'block_admin' => \App\Http\Middleware\BlockAdminMiddleware::class,
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'prevent_duplicates' => \App\Http\Middleware\PreventDuplicateSubmissions::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, \Illuminate\Http\Request $request) {
            if ($request->is('api/*')) {
                return response()->json(['message' => 'Unauthenticated.'], 401);
            }
        });
    })->create();

// When installed under C:\Program Files, non-elevated web workers may not have write access to storage/.
// Automatically fall back to a writable storage directory in the user's temp folder when needed.
$defaultStorage = dirname(__DIR__).DIRECTORY_SEPARATOR.'storage';
$defaultLogsDir = $defaultStorage.DIRECTORY_SEPARATOR.'logs';
$defaultLogFile = $defaultLogsDir.DIRECTORY_SEPARATOR.'laravel.log';
$defaultViewsDir = $defaultStorage.DIRECTORY_SEPARATOR.'framework'.DIRECTORY_SEPARATOR.'views';

$isStorageWritable = is_writable($defaultLogsDir)
    && is_writable($defaultViewsDir)
    && (!file_exists($defaultLogFile) || is_writable($defaultLogFile));

if (!$isStorageWritable) {
    $fallbackStorage = rtrim(sys_get_temp_dir(), '\\/').DIRECTORY_SEPARATOR.'nasripoint-storage';
    foreach ([
        $fallbackStorage.DIRECTORY_SEPARATOR.'app'.DIRECTORY_SEPARATOR.'private',
        $fallbackStorage.DIRECTORY_SEPARATOR.'app'.DIRECTORY_SEPARATOR.'public',
        $fallbackStorage.DIRECTORY_SEPARATOR.'framework'.DIRECTORY_SEPARATOR.'cache'.DIRECTORY_SEPARATOR.'data',
        $fallbackStorage.DIRECTORY_SEPARATOR.'framework'.DIRECTORY_SEPARATOR.'sessions',
        $fallbackStorage.DIRECTORY_SEPARATOR.'framework'.DIRECTORY_SEPARATOR.'testing',
        $fallbackStorage.DIRECTORY_SEPARATOR.'framework'.DIRECTORY_SEPARATOR.'views',
        $fallbackStorage.DIRECTORY_SEPARATOR.'logs',
        $fallbackStorage.DIRECTORY_SEPARATOR.'inertia-devtools',
    ] as $dir) {
        if (!is_dir($dir)) {
            @mkdir($dir, 0777, true);
        }
    }
    $app->useStoragePath($fallbackStorage);
}

return $app;
