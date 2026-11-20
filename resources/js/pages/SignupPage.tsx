import { useState, useEffect, useRef } from 'react';
import { Store, User, MapPin, DollarSign, Mail, Lock, CheckCircle2, MapPinned, ArrowRight, ArrowLeft, ShieldCheck, RefreshCw } from 'lucide-react';
import PhoneInput, { COUNTRY_CODES, useGeoCountry, getInternationalPhone, type CountryCode } from '@/components/PhoneInput';
import { useForm, Head, Link } from '@inertiajs/react';
import { toast } from 'sonner';
import { getEmailValidationError } from '@/lib/email';

const CURRENCIES = ['KSh', 'USD', 'EUR', 'GBP', 'TZS', 'UGX', 'ETB', 'SSP', 'RWF', 'BIF'];

function maskEmailAddress(rawEmail: string): string {
  const email = (rawEmail || '').trim();
  const [local, domain] = email.split('@');
  if (!local || !domain) return email;
  if (local.length <= 2) {
    return `${local[0] || ''}***@${domain}`;
  }
  return `${local[0]}${'*'.repeat(Math.min(5, local.length - 2))}${local[local.length - 1]}@${domain}`;
}

function getCsrfToken(): string {
  const csrfCookie = document.cookie
    .split('; ')
    .find(row => row.startsWith('XSRF-TOKEN='))
    ?.split('=')[1];
  return csrfCookie ? decodeURIComponent(csrfCookie) : '';
}

export default function SignupPage() {
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const [step1Error, setStep1Error] = useState('');
  const [sendingOtp, setSendingOtp] = useState(false);

  // Step 2: 6-digit Email OTP verification state
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [emailVerifiedFor, setEmailVerifiedFor] = useState<string>('');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const { data, setData, post, processing, errors, clearErrors } = useForm({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    storeName: '',
    storePhone: '',
    storeLocation: '',
    currency: 'KSh',
    verificationToken: '',
  });

  const [selectedCountry, setSelectedCountry] = useState<CountryCode>(COUNTRY_CODES[0]);
  const [phoneError, setPhoneError] = useState('');

  const { detect, detecting } = useGeoCountry((country) => {
    setSelectedCountry(country);
    toast.success(`Country detected: ${country.country} (${country.dialCode})`);
  });

  useEffect(() => {
    detect();
  }, []);

  // Countdown timer for Resend OTP cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // Focus first OTP box when entering Step 2
  useEffect(() => {
    if (step === 2) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [step]);

  const validateStep1 = () => {
    clearErrors();
    setStep1Error('');

    if (!data.fullName.trim()) {
      const msg = 'Full name is required.';
      setStep1Error(msg);
      toast.error(msg);
      return false;
    }

    const emailErr = getEmailValidationError(data.email);
    if (emailErr) {
      setStep1Error(emailErr);
      toast.error(emailErr);
      return false;
    }

    if (data.password.length < 6) {
      const msg = 'Password must be at least 6 characters.';
      setStep1Error(msg);
      toast.error(msg);
      return false;
    }

    if (data.password !== data.confirmPassword) {
      const msg = 'Passwords do not match.';
      setStep1Error(msg);
      toast.error(msg);
      return false;
    }

    return true;
  };

  const requestSignupOtp = async (isResend = false): Promise<boolean> => {
    const normalizedEmail = data.email.trim().toLowerCase();
    try {
      const res = await fetch('/api/signup-otp/send', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(getCsrfToken() ? { 'X-XSRF-TOKEN': getCsrfToken() } : {}),
        },
        body: JSON.stringify({
          fullName: data.fullName.trim(),
          email: normalizedEmail,
          password: data.password,
          is_resend: isResend,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.success) {
        const errMsg =
          body?.errors?.email?.[0] ||
          body?.message ||
          'Failed to send verification code. Please check your email address.';
        if (step === 1) {
          setStep1Error(errMsg);
        } else {
          setOtpError(errMsg);
        }
        toast.error(errMsg);
        return false;
      }

      setOtpDigits(['', '', '', '', '', '']);
      setOtpError('');
      setResendCooldown(60);
      toast.success(body.message || `A 6-digit verification code has been sent to ${normalizedEmail}.`);
      return true;
    } catch (_) {
      const errMsg = 'Network error while sending verification code. Please try again.';
      if (step === 1) {
        setStep1Error(errMsg);
      } else {
        setOtpError(errMsg);
      }
      toast.error(errMsg);
      return false;
    }
  };

  const handleStep1Continue = async () => {
    if (step !== 1 || sendingOtp) return;
    if (!validateStep1()) return;

    const normalizedEmail = data.email.trim().toLowerCase();
    // If this exact email was already verified in the current signup session, advance directly to Store Setup
    if (emailVerifiedFor === normalizedEmail && data.verificationToken) {
      setStep(3);
      return;
    }

    setSendingOtp(true);
    try {
      const sent = await requestSignupOtp(false);
      if (sent) {
        setStep(2);
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const handleOtpDigitChange = (index: number, rawValue: string) => {
    setOtpError('');
    const digitsOnly = rawValue.replace(/\D/g, '');
    if (!digitsOnly) {
      const next = [...otpDigits];
      next[index] = '';
      setOtpDigits(next);
      return;
    }

    // Handle multi-digit input or paste into a single box
    if (digitsOnly.length > 1) {
      const next = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        if (index + i < 6 && digitsOnly[i]) {
          next[index + i] = digitsOnly[i];
        }
      }
      setOtpDigits(next);
      const focusIdx = Math.min(5, index + digitsOnly.length);
      otpInputRefs.current[focusIdx]?.focus();
      return;
    }

    const next = [...otpDigits];
    next[index] = digitsOnly[0];
    setOtpDigits(next);
    if (index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const next = [...otpDigits];
        next[index - 1] = '';
        setOtpDigits(next);
        otpInputRefs.current[index - 1]?.focus();
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      handleVerifyOtp();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasted) return;
    const next = ['', '', '', '', '', ''];
    for (let i = 0; i < pasted.length; i++) {
      next[i] = pasted[i];
    }
    setOtpDigits(next);
    setOtpError('');
    const focusIdx = Math.min(5, pasted.length);
    otpInputRefs.current[focusIdx]?.focus();
  };

  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (verifyingOtp) return;

    const code = otpDigits.join('');
    if (code.length !== 6 || !/^\d{6}$/.test(code)) {
      const msg = 'Please enter the complete 6-digit verification code.';
      setOtpError(msg);
      toast.error(msg);
      return;
    }

    const normalizedEmail = data.email.trim().toLowerCase();
    setVerifyingOtp(true);
    setOtpError('');

    try {
      const res = await fetch('/api/signup-otp/verify', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...(getCsrfToken() ? { 'X-XSRF-TOKEN': getCsrfToken() } : {}),
        },
        body: JSON.stringify({
          email: normalizedEmail,
          otp: code,
        }),
      });

      const body = await res.json().catch(() => ({}));
      if (!res.ok || !body?.valid) {
        const msg = body?.message || 'Invalid or expired verification code. Please try again.';
        setOtpError(msg);
        toast.error(msg);
        return;
      }

      setData('verificationToken', body.verification_token || 'verified');
      setEmailVerifiedFor(normalizedEmail);
      toast.success('Email verified! Complete your store details to finish setup.');
      setStep(3);
    } catch (_) {
      const msg = 'Unable to verify code right now. Please try again.';
      setOtpError(msg);
      toast.error(msg);
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendingOtp || resendCooldown > 0) return;
    setResendingOtp(true);
    try {
      await requestSignupOtp(true);
    } finally {
      setResendingOtp(false);
    }
  };

  const validateStep3 = () => {
    clearErrors();
    const emailErr = getEmailValidationError(data.email);
    if (emailErr) {
      setStep1Error(emailErr);
      setStep(1);
      toast.error(emailErr);
      return false;
    }
    const normalizedEmail = data.email.trim().toLowerCase();
    if (emailVerifiedFor !== normalizedEmail || !data.verificationToken) {
      setOtpError('Please verify your email address with the 6-digit code before creating your store.');
      setStep(2);
      toast.error('Please verify your email address first.');
      return false;
    }
    if (!data.storeName.trim()) {
      toast.error('Store name is required.');
      return false;
    }
    if (data.storePhone && data.storePhone.length !== selectedCountry.phoneLength) {
      setPhoneError(`Phone number must contain exactly ${selectedCountry.phoneLength} digits for ${selectedCountry.country}.`);
      return false;
    }
    setPhoneError('');
    return true;
  };

  const handleBackToStep1 = () => {
    clearErrors();
    setStep1Error('');
    setOtpError('');
    setPhoneError('');
    setStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep3()) return;

    const internationalPhone = data.storePhone ? getInternationalPhone(selectedCountry, data.storePhone) : '';
    setData('storePhone', internationalPhone);

    post('/signup-with-store', {
      onSuccess: () => {
        toast.success('Account created! Your store is ready.');
      },
      onError: (errs) => {
        if (errs.email || errs.password || errs.fullName) {
          const msg = errs.email || errs.password || errs.fullName;
          setStep1Error(msg);
          setStep(1);
          toast.error(msg);
        } else if (errs.storeName) {
          toast.error(errs.storeName);
        }
      },
    });
  };

  const stepLabel =
    step === 1 ? 'Your Details' : step === 2 ? 'Email Verification Code' : 'Store Details';

  return (
    <div className="min-h-screen w-full flex bg-background">
      <Head title="Create Account" />

      {/* Left Panel: Form */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 sm:p-12 lg:p-24 relative z-10 overflow-y-auto">
        <div className="w-full max-w-[420px]">
          <div className="flex flex-col items-start mb-8">
            <h1 className="text-3xl font-light text-foreground tracking-tight capitalize">
              Create <span className="font-semibold">Account</span>
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              Start your 14-day free trial. No credit card required.
            </p>

            <div className="w-full mt-6">
              <div className="flex justify-between text-xs font-semibold text-muted-foreground capitalize tracking-wider mb-2">
                <span>{stepLabel}</span>
                <span>
                  Step {step} of {totalSteps}
                </span>
              </div>
              <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500 ease-in-out"
                  style={{ width: `${(step / totalSteps) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* STEP 1: Account Details */}
          {step === 1 && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-5">
                {(errors.email || step1Error) && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                    {errors.email || step1Error}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground capitalize tracking-wider">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    value={data.fullName}
                    onChange={e => setData('fullName', e.target.value)}
                    placeholder="Enter your full name"
                    className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground capitalize tracking-wider">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={e => {
                      const nextEmail = e.target.value;
                      setData('email', nextEmail);
                      if (emailVerifiedFor && emailVerifiedFor !== nextEmail.trim().toLowerCase()) {
                        setEmailVerifiedFor('');
                        setData('verificationToken', '');
                      }
                    }}
                    placeholder="Enter your email"
                    className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground capitalize tracking-wider">
                      Password *
                    </label>
                    <input
                      type="password"
                      value={data.password}
                      onChange={e => setData('password', e.target.value)}
                      placeholder="Min 6 chars"
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-muted-foreground capitalize tracking-wider">
                      Confirm *
                    </label>
                    <input
                      type="password"
                      value={data.confirmPassword}
                      onChange={e => setData('confirmPassword', e.target.value)}
                      placeholder="Repeat password"
                      className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleStep1Continue}
                  disabled={sendingOtp}
                  className="w-full h-11 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity mt-6 capitalize disabled:opacity-50"
                >
                  {sendingOtp ? 'Sending Verification Code...' : 'Continue'}{' '}
                  {!sendingOtp && <ArrowRight size={16} />}
                </button>
              </div>

              <div className="pt-6 border-t border-border mt-8 text-center">
                <p className="text-sm text-muted-foreground">
                  Already have an account?{' '}
                  <Link
                    href="/login"
                    className="text-foreground hover:text-primary font-semibold transition-colors"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* STEP 2: 6-Digit Email OTP Verification */}
          {step === 2 && (
            <form
              onSubmit={handleVerifyOtp}
              className="animate-in fade-in slide-in-from-right-4 duration-300 space-y-6"
            >
              <div className="bg-muted/40 border border-border rounded-xl p-4 flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0 mt-0.5">
                  <Mail size={18} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">Check your email for a 6-digit code</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed break-all">
                    We sent a verification code to{' '}
                    <span className="font-semibold text-foreground">{maskEmailAddress(data.email)}</span>{' '}
                    <span className="text-muted-foreground">({data.email.trim()})</span>. The code expires in 10
                    minutes.
                  </p>
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="text-xs font-semibold text-primary hover:underline mt-2 inline-block"
                  >
                    Change email address
                  </button>
                </div>
              </div>

              {otpError && (
                <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                  {otpError}
                </div>
              )}

              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground capitalize tracking-wider block">
                  6-Digit Verification Code *
                </label>
                <div className="grid grid-cols-6 gap-2 sm:gap-3">
                  {otpDigits.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={el => {
                        otpInputRefs.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      value={digit}
                      onChange={e => handleOtpDigitChange(idx, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      className="w-full h-12 sm:h-14 text-center text-lg sm:text-xl font-bold rounded-md border border-input bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all shadow-sm font-mono"
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-muted-foreground">Didn't receive the code?</span>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendingOtp || resendCooldown > 0}
                  className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline disabled:text-muted-foreground disabled:no-underline disabled:cursor-not-allowed"
                >
                  <RefreshCw size={13} className={resendingOtp ? 'animate-spin' : ''} />
                  {resendingOtp
                    ? 'Sending...'
                    : resendCooldown > 0
                    ? `Resend Code (${resendCooldown}s)`
                    : 'Resend Code'}
                </button>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleBackToStep1}
                  className="flex-1 h-11 flex items-center justify-center gap-2 rounded-md bg-muted text-foreground text-sm font-semibold hover:bg-accent transition-colors capitalize"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  disabled={verifyingOtp || otpDigits.join('').length !== 6}
                  className="flex-[2] h-11 flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 capitalize"
                >
                  <ShieldCheck size={16} />
                  {verifyingOtp ? 'Verifying...' : 'Verify & Continue'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Store Details */}
          {step === 3 && (
            <form onSubmit={handleSubmit} className="animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="space-y-5">
                <div className="bg-primary/5 border border-primary/20 rounded-md px-3.5 py-2.5 flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 font-medium text-foreground truncate">
                    <CheckCircle2 size={15} className="text-primary shrink-0" />
                    <span className="truncate">Verified: {data.email.trim()}</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="text-primary font-semibold hover:underline shrink-0 ml-2"
                  >
                    Change
                  </button>
                </div>

                {errors.storeName && (
                  <div className="bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                    {errors.storeName}
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground capitalize tracking-wider">
                    Store Name *
                  </label>
                  <input
                    type="text"
                    value={data.storeName}
                    onChange={e => setData('storeName', e.target.value)}
                    placeholder="What is your business called?"
                    className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="flex items-center justify-between text-xs font-bold text-muted-foreground capitalize tracking-wider">
                    <span>Business Phone</span>
                    {detecting && (
                      <span className="flex items-center gap-1 text-primary lowercase normal-case text-[10px]">
                        <MapPinned size={10} className="animate-pulse" /> detecting country...
                      </span>
                    )}
                  </label>
                  <PhoneInput
                    value={data.storePhone}
                    onChange={(digits) => {
                      setData('storePhone', digits);
                      setPhoneError('');
                    }}
                    selectedCountry={selectedCountry}
                    onCountryChange={setSelectedCountry}
                    error={phoneError}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground capitalize tracking-wider">
                    Store Location
                  </label>
                  <input
                    type="text"
                    value={data.storeLocation}
                    onChange={e => setData('storeLocation', e.target.value)}
                    placeholder="City, Area, or full address"
                    className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-muted-foreground capitalize tracking-wider">
                    Primary Currency
                  </label>
                  <select
                    value={data.currency}
                    onChange={e => setData('currency', e.target.value)}
                    className="w-full px-4 h-11 rounded-md border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all shadow-sm appearance-none"
                  >
                    {CURRENCIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-md p-4 flex items-start gap-3 mt-4">
                  <CheckCircle2 size={18} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">14-day free trial included</p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Get full access to all POS features. No credit card required. Cancel anytime.
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleBackToStep1}
                    className="flex-1 h-11 flex items-center justify-center gap-2 rounded-md bg-muted text-foreground text-sm font-semibold hover:bg-accent transition-colors capitalize"
                  >
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button
                    type="submit"
                    disabled={processing}
                    className="flex-[2] h-11 flex items-center justify-center rounded-md bg-primary text-primary-foreground text-sm font-bold shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50 capitalize"
                  >
                    {processing ? 'Creating...' : 'Create Store'}
                  </button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Right Panel: Decorative (Hidden on mobile) */}
      <div className="hidden lg:flex w-1/2 bg-muted relative overflow-hidden items-center justify-center border-l border-border">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-background/50"></div>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)',
            backgroundSize: '32px 32px',
          }}
        ></div>

        <div className="relative z-10 max-w-lg p-12">
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <h3 className="font-semibold text-foreground capitalize">Sign Up & Verify</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Enter your details and verify your email with a 6-digit security code.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <h3 className="font-semibold text-foreground capitalize">Setup Store</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Add your business details to configure your receipt branding.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <h3 className="font-semibold text-foreground capitalize">Add Products</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Easily import your inventory or create products individually.
              </p>
            </div>
            <div className="space-y-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                4
              </div>
              <h3 className="font-semibold text-foreground capitalize">Start Selling</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Use the POS interface to ring up sales and track your cash flow.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
