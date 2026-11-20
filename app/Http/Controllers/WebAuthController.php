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
    /**
     * Common misspelled / typo email provider domains mapped to their intended domain.
     */
    public const MISSPELLED_EMAIL_DOMAINS = [
        // Gmail typos
        'ggmail.com' => 'gmail.com',
        'gmai.com' => 'gmail.com',
        'gmial.com' => 'gmail.com',
        'gamil.com' => 'gmail.com',
        'gmal.com' => 'gmail.com',
        'gmaill.com' => 'gmail.com',
        'gmaul.com' => 'gmail.com',
        'gnail.com' => 'gmail.com',
        'gmil.com' => 'gmail.com',
        'gmaik.com' => 'gmail.com',
        'gmail.co' => 'gmail.com',
        'gmail.cm' => 'gmail.com',
        'gmail.con' => 'gmail.com',
        'gmail.cmo' => 'gmail.com',
        'gmail.comm' => 'gmail.com',
        'gmail.om' => 'gmail.com',
        'gmail.net' => 'gmail.com',
        'gmail.org' => 'gmail.com',
        'g-mail.com' => 'gmail.com',
        'gogglemail.com' => 'gmail.com',
        'googlmail.com' => 'gmail.com',
        // Yahoo typos
        'yaho.com' => 'yahoo.com',
        'yahooo.com' => 'yahoo.com',
        'yhoo.com' => 'yahoo.com',
        'yaoo.com' => 'yahoo.com',
        'yhaoo.com' => 'yahoo.com',
        'yahoo.co' => 'yahoo.com',
        'yahoo.cm' => 'yahoo.com',
        'yahoo.con' => 'yahoo.com',
        'yahoo.cmo' => 'yahoo.com',
        'ymial.com' => 'ymail.com',
        // Hotmail typos
        'hotmial.com' => 'hotmail.com',
        'hotmal.com' => 'hotmail.com',
        'hotmai.com' => 'hotmail.com',
        'hotmaill.com' => 'hotmail.com',
        'homtail.com' => 'hotmail.com',
        'htomail.com' => 'hotmail.com',
        'hotmail.co' => 'hotmail.com',
        'hotmail.cm' => 'hotmail.com',
        'hotmail.con' => 'hotmail.com',
        'hotmail.cmo' => 'hotmail.com',
        // Outlook typos
        'outlok.com' => 'outlook.com',
        'outllook.com' => 'outlook.com',
        'outloo.com' => 'outlook.com',
        'oultook.com' => 'outlook.com',
        'outlook.co' => 'outlook.com',
        'outlook.cm' => 'outlook.com',
        'outlook.con' => 'outlook.com',
        'outlook.cmo' => 'outlook.com',
        // iCloud typos
        'iclod.com' => 'icloud.com',
        'icoud.com' => 'icloud.com',
        'icloud.co' => 'icloud.com',
        'icloud.cm' => 'icloud.com',
        'icloud.con' => 'icloud.com',
    ];

    /**
     * Known major email domains whose MX deliverability is guaranteed even when local/offline DNS is unavailable.
     */
    public const KNOWN_VALID_EMAIL_DOMAINS = [
        'gmail.com',
        'googlemail.com',
        'yahoo.com',
        'yahoo.co.uk',
        'ymail.com',
        'outlook.com',
        'hotmail.com',
        'hotmail.co.uk',
        'live.com',
        'msn.com',
        'icloud.com',
        'me.com',
        'mac.com',
        'aol.com',
        'protonmail.com',
        'proton.me',
        'zoho.com',
        'yandex.com',
        'mail.com',
        'gmx.com',
    ];

    /**
     * Check whether a domain has valid, non-null DNS MX records (with safe fallback when outbound DNS is unavailable).
     */
    public static function domainHasDeliverableMx(string $domain): bool
    {
        $domain = strtolower(trim($domain));
        if ($domain === '' || isset(self::MISSPELLED_EMAIL_DOMAINS[$domain])) {
            return false;
        }

        try {
            if (function_exists('dns_get_record')) {
                $mxRecords = @dns_get_record($domain, DNS_MX);
                if (is_array($mxRecords) && count($mxRecords) > 0) {
                    foreach ($mxRecords as $record) {
                        $target = trim((string) ($record['target'] ?? ''), '. ');
                        // RFC 7505 "Null MX" (0 .) indicates the domain does NOT accept email
                        if ($target !== '') {
                            return true;
                        }
                    }
                    return false;
                }
            } elseif (function_exists('checkdnsrr')) {
                if (@checkdnsrr($domain, 'MX')) {
                    return true;
                }
            }

            // If MX lookup returned empty/false, verify whether outbound DNS is working in this environment
            // by checking gmail.com MX. If gmail.com MX resolves, outbound DNS works and $domain genuinely lacks MX records.
            $dnsAvailable = function_exists('checkdnsrr') && @checkdnsrr('gmail.com', 'MX');
            if ($dnsAvailable) {
                return false;
            }
        } catch (\Throwable $e) {
            // Fall through to offline fallback below
        }

        // Offline / sandboxed environment fallback where outbound DNS is blocked
        return in_array($domain, self::KNOWN_VALID_EMAIL_DOMAINS, true);
    }

    /**
     * Strict email validation rules rejecting malformed addresses, typo domains (e.g. ggmail.com),
     * and non-deliverable domains without valid DNS MX records.
     */
    public static function strictEmailRules(bool $uniqueUsers = false): array
    {
        $rules = [
            'required',
            'string',
            'max:254',
            'email:rfc',
            function (string $attribute, mixed $value, \Closure $fail) {
                $email = strtolower(trim((string) $value));
                if (
                    $email === '' ||
                    str_contains($email, '..') ||
                    !preg_match('/^[a-zA-Z0-9.!#$%&\'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/', $email)
                ) {
                    $fail('Please enter a valid email address (e.g. name@example.com).');
                    return;
                }
                [$local, $domain] = explode('@', $email, 2);
                if (str_starts_with($local, '.') || str_ends_with($local, '.')) {
                    $fail('Please enter a valid email address (e.g. name@example.com).');
                    return;
                }
                $domainParts = explode('.', $domain);
                $tld = end($domainParts);
                if (!$tld || !preg_match('/^[a-zA-Z]{2,}$/', $tld)) {
                    $fail('Please enter a valid email address with a working domain.');
                    return;
                }

                // Reject common misspelled/squatted domains like ggmail.com
                if (isset(self::MISSPELLED_EMAIL_DOMAINS[$domain])) {
                    $suggested = self::MISSPELLED_EMAIL_DOMAINS[$domain];
                    $fail("Please enter a valid email address with a working domain (did you mean @{$suggested}?).");
                    return;
                }

                // Verify DNS MX deliverability (with safe offline fallback)
                if (!self::domainHasDeliverableMx($domain)) {
                    $fail('Please enter a valid email address with a working domain.');
                }
            },
        ];

        if ($uniqueUsers) {
            $rules[] = 'unique:users,email';
        }

        return $rules;
    }

    /**
     * Synchronize the session password hash for Sanctum's AuthenticateSession middleware.
     */
    protected function syncSessionPasswordHash(Request $request, User $user): void
    {
        if (!$request->hasSession()) {
            return;
        }
        $guard = Auth::guard('web');
        $hash = method_exists($guard, 'hashPasswordForCookie')
            ? $guard->hashPasswordForCookie($user->getAuthPassword())
            : $user->getAuthPassword();
        $request->session()->put('password_hash_web', $hash);
    }

    // ================================================================
    // NORMAL USER LOGIN — /login
    // Only for owners and staff. Admins are rejected.
    // ================================================================
    public function login(Request $request)
    {
        $request->merge(['email' => strtolower(trim((string) $request->input('email', '')))]);

        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $request->session()->forget('password_hash_web');

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            $user = Auth::user();
            if ($user) {
                $this->syncSessionPasswordHash($request, $user);
            }
            $access = $user ? \App\Support\AccessCache::getUserAccess($user) : ['is_admin' => false];

            // Block platform super admin users from the regular store login
            if (!empty($access['is_admin'])) {
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
            $user = Auth::user();
            $access = $user ? \App\Support\AccessCache::getUserAccess($user) : ['is_admin' => false];

            // Strictly verify Platform Super Admin role (reject Store Admins, Store Owners, and Cashiers)
            if (empty($access['is_admin'])) {
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
        $request->merge(['email' => strtolower(trim((string) $request->input('email', '')))]);

        $request->validate([
            'email' => self::strictEmailRules(true),
            'password' => 'required|min:6',
        ], [
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address (e.g. name@example.com).',
            'email.unique' => 'This email address is already registered.',
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

        $request->session()->forget('password_hash_web');
        Auth::login($user);
        $request->session()->regenerate();
        $this->syncSessionPasswordHash($request, $user);

        return Inertia::location('/dashboard');
    }

    // ================================================================
    // SIGNUP WITH STORE — /signup-with-store
    // ================================================================
    public function signupWithStore(Request $request)
    {
        $request->merge(['email' => strtolower(trim((string) $request->input('email', '')))]);

        $request->validate([
            'email' => self::strictEmailRules(true),
            'password' => 'required|min:6',
            'storeName' => 'required|string|max:255',
        ], [
            'email.required' => 'Email address is required.',
            'email.email' => 'Please enter a valid email address (e.g. name@example.com).',
            'email.unique' => 'This email address is already registered.',
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
            'store_code' => \App\Models\Store::generateUniqueStoreCode(),
            'phone' => $request->storePhone ?? '',
            'location' => $request->storeLocation ?? '',
            'currency' => $request->currency ?? 'KSh',
        ]);

        \App\Support\AccessCache::clearUserAccess((string) $user->id);

        $request->session()->forget('password_hash_web');
        Auth::login($user);
        $request->session()->regenerate();
        $this->syncSessionPasswordHash($request, $user);

        return Inertia::location('/dashboard');
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
