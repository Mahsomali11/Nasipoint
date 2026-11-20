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
    // EMAIL OTP VERIFICATION FOR REGISTRATION
    // ================================================================
    public function sendSignupOtp(Request $request)
    {
        $request->merge(['email' => strtolower(trim((string) $request->input('email', '')))]);

        $validator = \Illuminate\Support\Facades\Validator::make(
            $request->all(),
            [
                'fullName' => ['required', 'string', 'max:255'],
                'email' => self::strictEmailRules(true),
                'password' => ['required', 'string', 'min:6'],
            ],
            [
                'fullName.required' => 'Full name is required.',
                'email.required' => 'Email address is required.',
                'email.email' => 'Please enter a valid email address with a working domain.',
                'email.unique' => 'This email address is already registered.',
                'password.required' => 'Password is required.',
                'password.min' => 'Password must be at least 6 characters.',
            ]
        );

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => $validator->errors()->first(),
                'errors' => $validator->errors(),
            ], 422);
        }

        $email = $request->email;
        $fullName = trim((string) $request->input('fullName', ''));
        $cacheKey = "signup_otp_{$email}";

        $existing = \Illuminate\Support\Facades\Cache::get($cacheKey);
        if (is_array($existing) && isset($existing['sent_at'])) {
            $elapsed = now()->getTimestamp() - (int) $existing['sent_at'];
            if ($elapsed < 30 && $request->boolean('is_resend')) {
                $wait = 30 - $elapsed;
                return response()->json([
                    'success' => false,
                    'message' => "Please wait {$wait} seconds before requesting another code.",
                ], 429);
            }
        }

        $otp = (string) random_int(100000, 999999);
        $expiresAt = now()->addMinutes(10);

        \Illuminate\Support\Facades\Cache::put($cacheKey, [
            'otp_hash' => Hash::make($otp),
            'expires_at' => $expiresAt->getTimestamp(),
            'sent_at' => now()->getTimestamp(),
            'attempts' => 0,
        ], $expiresAt);

        \Illuminate\Support\Facades\Cache::forget("signup_otp_verified_{$email}");
        if ($request->hasSession()) {
            $request->session()->forget("signup_email_verified_{$email}");
        }

        try {
            \Illuminate\Support\Facades\Mail::to($email)->send(
                new \App\Mail\RegistrationOtpMail($otp, $fullName)
            );
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::error("Failed to send signup OTP email to {$email}: " . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Unable to send verification email at this time. Please check your email address and try again.',
            ], 500);
        }

        return response()->json([
            'success' => true,
            'message' => "A 6-digit verification code has been sent to {$email}.",
            'expires_in_seconds' => 600,
        ]);
    }

    public function verifySignupOtp(Request $request)
    {
        $email = strtolower(trim((string) $request->input('email', '')));
        $otp = preg_replace('/\D/', '', (string) $request->input('otp', ''));

        if ($email === '' || strlen($otp) !== 6) {
            return response()->json([
                'valid' => false,
                'message' => 'Please enter a valid 6-digit verification code.',
            ], 422);
        }

        $cacheKey = "signup_otp_{$email}";
        $cached = \Illuminate\Support\Facades\Cache::get($cacheKey);

        if (!is_array($cached) || empty($cached['otp_hash']) || now()->getTimestamp() > (int) ($cached['expires_at'] ?? 0)) {
            \Illuminate\Support\Facades\Cache::forget($cacheKey);
            return response()->json([
                'valid' => false,
                'message' => 'This verification code has expired or does not exist. Please click "Resend Code" to get a new code.',
            ], 422);
        }

        $attempts = (int) ($cached['attempts'] ?? 0);
        if ($attempts >= 5) {
            \Illuminate\Support\Facades\Cache::forget($cacheKey);
            return response()->json([
                'valid' => false,
                'message' => 'Too many incorrect attempts. Please click "Resend Code" to generate a new verification code.',
            ], 422);
        }

        if (!Hash::check($otp, (string) $cached['otp_hash'])) {
            $cached['attempts'] = $attempts + 1;
            $remainingTtl = max(60, (int) $cached['expires_at'] - now()->getTimestamp());
            \Illuminate\Support\Facades\Cache::put($cacheKey, $cached, now()->addSeconds($remainingTtl));

            return response()->json([
                'valid' => false,
                'message' => 'Invalid verification code. Please check the 6-digit code sent to your email and try again.',
            ], 422);
        }

        // OTP is valid: invalidate the one-time code and record verified state
        \Illuminate\Support\Facades\Cache::forget($cacheKey);
        $verificationToken = Str::random(48);
        \Illuminate\Support\Facades\Cache::put("signup_otp_verified_{$email}", $verificationToken, now()->addMinutes(30));

        if ($request->hasSession()) {
            $request->session()->put("signup_email_verified_{$email}", true);
        }

        return response()->json([
            'valid' => true,
            'verification_token' => $verificationToken,
            'message' => 'Email verified successfully.',
        ]);
    }

    /**
     * Check and consume the verified OTP state for an email before finalizing user creation.
     */
    public static function verifyAndConsumeEmailOtp(Request $request, string $email): ?string
    {
        $email = strtolower(trim($email));
        $verifiedKey = "signup_otp_verified_{$email}";
        $cachedToken = \Illuminate\Support\Facades\Cache::get($verifiedKey);
        $submittedToken = (string) ($request->input('verificationToken') ?? $request->input('verification_token') ?? '');
        $sessionVerified = $request->hasSession() && $request->session()->get("signup_email_verified_{$email}") === true;

        $isVerified = false;
        if ($sessionVerified) {
            $isVerified = true;
        } elseif (!empty($cachedToken) && ($submittedToken === '' || hash_equals((string) $cachedToken, $submittedToken))) {
            $isVerified = true;
        } else {
            // Also allow direct OTP verification if `otp` was submitted with the final signup request
            $rawOtp = preg_replace('/\D/', '', (string) $request->input('otp', ''));
            if (strlen($rawOtp) === 6) {
                $otpData = \Illuminate\Support\Facades\Cache::get("signup_otp_{$email}");
                if (
                    is_array($otpData) &&
                    !empty($otpData['otp_hash']) &&
                    now()->getTimestamp() <= (int) ($otpData['expires_at'] ?? 0) &&
                    Hash::check($rawOtp, (string) $otpData['otp_hash'])
                ) {
                    $isVerified = true;
                }
            }
        }

        if (!$isVerified) {
            return 'Please verify your email address with the 6-digit verification code before creating your account.';
        }

        \Illuminate\Support\Facades\Cache::forget("signup_otp_{$email}");
        \Illuminate\Support\Facades\Cache::forget($verifiedKey);
        if ($request->hasSession()) {
            $request->session()->forget("signup_email_verified_{$email}");
        }

        return null;
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

        if ($otpError = self::verifyAndConsumeEmailOtp($request, $request->email)) {
            return back()->withErrors(['email' => $otpError])->onlyInput('email');
        }

        $data = $request->all();
        $options = $data['options']['data'] ?? [];

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'name' => $options['full_name'] ?? '',
            'full_name' => $options['full_name'] ?? '',
            'phone' => $options['phone'] ?? '',
            'email_verified_at' => now(),
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

        if ($otpError = self::verifyAndConsumeEmailOtp($request, $request->email)) {
            return back()->withErrors(['email' => $otpError])->onlyInput('email');
        }

        $user = User::create([
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'name' => $request->fullName ?? '',
            'full_name' => $request->fullName ?? '',
            'phone' => $request->phone ?? '',
            'email_verified_at' => now(),
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
