<?php

namespace App\Mail;

use App\Support\AccessCache;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class RegistrationOtpMail extends Mailable
{
    use Queueable, SerializesModels;

    public string $otp;
    public string $recipientName;
    public string $platformName;

    public function __construct(string $otp, string $recipientName = '')
    {
        $this->otp = $otp;
        $this->recipientName = trim($recipientName) !== '' ? trim($recipientName) : 'there';
        $branding = AccessCache::getSystemBranding();
        $this->platformName = $branding['platform_name'] ?? config('app.name', 'Nasri Account System');
    }

    public function build(): self
    {
        $escapedName = e($this->recipientName);
        $escapedPlatform = e($this->platformName);
        $escapedOtp = e($this->otp);

        $html = <<<HTML
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Verify Your Email - {$escapedPlatform}</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="max-width:520px;margin:40px auto;background:#ffffff;border-radius:12px;border:1px solid #e4e4e7;overflow:hidden;box-shadow:0 4px 12px rgba(0,0,0,0.05);">
        <div style="padding:28px 32px;background:#18181b;color:#ffffff;">
            <h1 style="margin:0;font-size:20px;font-weight:700;letter-spacing:-0.02em;">{$escapedPlatform}</h1>
            <p style="margin:6px 0 0;font-size:13px;color:#a1a1aa;">Email Verification Code</p>
        </div>
        <div style="padding:32px;">
            <p style="margin:0 0 16px;font-size:15px;color:#27272a;line-height:1.6;">Hello <strong>{$escapedName}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#52525b;line-height:1.6;">
                Use the 6-digit verification code below to verify your email address and complete your account registration:
            </p>
            <div style="margin:24px 0;padding:20px;background:#f4f4f5;border:1px dashed #d4d4d8;border-radius:10px;text-align:center;">
                <span style="font-family:'Courier New',Courier,monospace;font-size:32px;font-weight:800;letter-spacing:10px;color:#18181b;">{$escapedOtp}</span>
            </div>
            <p style="margin:0 0 12px;font-size:13px;color:#71717a;line-height:1.5;">
                This code expires in <strong>10 minutes</strong>. If you did not request this code, you can safely ignore this email.
            </p>
        </div>
        <div style="padding:16px 32px;background:#fafafa;border-top:1px solid #e4e4e7;font-size:12px;color:#a1a1aa;text-align:center;">
            &copy; {$escapedPlatform}. All rights reserved.
        </div>
    </div>
</body>
</html>
HTML;

        return $this->subject("Your {$this->platformName} Verification Code: {$this->otp}")
            ->html($html);
    }
}

