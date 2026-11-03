<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Support\Facades\Password;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Support\Str;

class WebAuthController extends Controller
{
    // ================================================================
    // NORMAL USER LOGIN — /login
    // Only for owners and staff. Admins are rejected.
    // ================================================================
    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            $userId = Auth::id();

            // Block admin users from the regular login
            $isAdmin = DB::table('admin_roles')
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->exists();

            if ($isAdmin) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();
                return back()->withErrors([
                    'email' => 'This account is a platform administrator. Please use the Admin Panel login.',
                ])->onlyInput('email');
            }

            return Inertia::location('/dashboard');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    // ================================================================
    // NORMAL USER LOGOUT — /logout
    // ================================================================
    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/login');
    }

    // ================================================================
    // ADMIN LOGIN — /admin/login
    // Only for users with an active entry in admin_roles.
    // ================================================================
    public function adminLogin(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        if (Auth::attempt($credentials)) {
            $userId = Auth::id();

            // Verify admin role
            $adminRow = DB::table('admin_roles')
                ->where('user_id', $userId)
                ->where('is_active', true)
                ->first();

            if (!$adminRow) {
                Auth::logout();
                $request->session()->invalidate();
                $request->session()->regenerateToken();

                return back()->withErrors([
                    'email' => 'Access denied. This login is for platform administrators only.',
                ])->onlyInput('email');
            }

            $request->session()->regenerate();
            return Inertia::location('/admin/dashboard');
        }

        return back()->withErrors([
            'email' => 'The provided credentials do not match our records.',
        ])->onlyInput('email');
    }

    // ================================================================
    // ADMIN LOGOUT — /admin/logout
    // ================================================================
    public function adminLogout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect('/admin/login');
    }

    // ================================================================
    // SIGNUP — /signup
    // ================================================================
    public function signup(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
        ]);

        $data = $request->all();
        $options = $data['options']['data'] ?? [];

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'name' => $options['full_name'] ?? '',
            'full_name' => $options['full_name'] ?? '',
            'phone' => $options['phone'] ?? '',
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect('/dashboard');
    }

    // ================================================================
    // SIGNUP WITH STORE — /signup-with-store
    // ================================================================
    public function signupWithStore(Request $request)
    {
        $request->validate([
            'email' => 'required|email|unique:users',
            'password' => 'required|min:6',
            'storeName' => 'required',
        ]);

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'name' => $request->fullName ?? '',
            'full_name' => $request->fullName ?? '',
            'phone' => $request->phone ?? '',
        ]);

        $store = \App\Models\Store::create([
            'owner_user_id' => $user->id,
            'store_name' => $request->storeName,
            'phone' => $request->storePhone ?? '',
            'location' => $request->storeLocation ?? '',
            'currency' => $request->currency ?? 'KSh',
        ]);

        Auth::login($user);
        $request->session()->regenerate();

        return redirect('/dashboard');
    }

    // ================================================================
    // PASSWORD RESET
    // ================================================================
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        
        $status = Password::broker()->sendResetLink(
            $request->only('email')
        );
        
        return $status === Password::RESET_LINK_SENT
                    ? response()->json(['success' => true, 'message' => __($status)])
                    : response()->json(['error' => __($status)], 400);
    }

    public function resetPassword(Request $request)
    {
        $request->validate([
            'token' => 'required',
            'email' => 'required|email',
            'password' => 'required|min:6',
        ]);

        $status = Password::broker()->reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password)
                ])->setRememberToken(Str::random(60));

                $user->save();
                event(new PasswordReset($user));
            }
        );

        return $status === Password::PASSWORD_RESET
                    ? response()->json(['success' => true, 'message' => __($status)])
                    : response()->json(['error' => __($status)], 400);
    }
}
