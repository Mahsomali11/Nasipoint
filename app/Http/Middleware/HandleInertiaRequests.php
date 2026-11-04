<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        $user = $request->user();
        $userPayload = null;
        $storesPayload = [];

        if ($user) {
            $access = \App\Support\AccessCache::getUserAccess($user);
            $userPayload = array_merge(
                $user->only(['id', 'name', 'full_name', 'email', 'phone', 'created_at']),
                [
                    'role' => $access['role'],
                    'admin_role' => $access['admin_role'],
                    'assigned_store_id' => $access['assigned_store_id'],
                ]
            );
            $storesPayload = $access['stores'] ?? [];
        }

        $systemBranding = \App\Support\AccessCache::getSystemBranding();

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $userPayload,
                'stores' => $storesPayload,
            ],
            'systemBranding' => $systemBranding,
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
                'success' => fn () => $request->session()->get('success'),
            ],
        ];
    }
}
