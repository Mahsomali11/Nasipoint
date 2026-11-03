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
        $role = null;
        $assigned_store_id = null;

        if ($user) {
            $isOwner = \App\Models\Store::where('owner_user_id', $user->id)->exists();
            if ($isOwner) {
                $role = 'owner';
            } else {
                $staff = \App\Models\StaffAccount::where('user_id', $user->id)->orWhere('email', $user->email)->first();
                if ($staff) {
                    $role = $staff->role;
                    $assigned_store_id = $staff->store_id;
                }
            }
        }

        return [
            ...parent::share($request),
            'auth' => [
                'user' => $user ? array_merge($user->toArray(), [
                    'role' => $role,
                    'assigned_store_id' => $assigned_store_id
                ]) : null,
            ],
            'flash' => [
                'message' => fn () => $request->session()->get('message'),
                'error' => fn () => $request->session()->get('error'),
                'success' => fn () => $request->session()->get('success'),
            ],
        ];
    }
}
