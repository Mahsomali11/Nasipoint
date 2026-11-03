<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <meta name="csrf-token" content="{{ csrf_token() }}">
        @php
            $brandingRows = [];
            try {
                $brandingRows = \App\Models\SystemSetting::whereIn('setting_key', ['platform_name', 'system_logo', 'system_favicon'])
                    ->pluck('setting_value', 'setting_key')
                    ->toArray();
            } catch (\Exception $e) {}
            $systemName = !empty($brandingRows['platform_name']) ? $brandingRows['platform_name'] : config('app.name', 'Nasri Account System');
            $systemFavicon = !empty($brandingRows['system_favicon']) ? $brandingRows['system_favicon'] : '/favicon.ico';
        @endphp
        <title inertia>{{ $systemName }}</title>
        <link id="system-favicon" rel="icon" href="{{ $systemFavicon }}">
        
        <!-- Fonts -->
        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&display=swap" rel="stylesheet" />

        <!-- Scripts -->
        @viteReactRefresh
        @vite(['resources/js/app.jsx', 'resources/js/index.css'])
        @inertiaHead
    </head>
    <body class="font-sans antialiased bg-background text-foreground">
        @inertia
    </body>
</html>
