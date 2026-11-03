<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Expense extends Model
{
    use HasUuids;
    protected $guarded = [];

    protected $casts = [
        'amount' => 'float',
        'refund_amount' => 'float',
        'refunded_at' => 'datetime',
    ];

    protected static function booted()
    {
        static::addGlobalScope(new \App\Models\Scopes\StaffActivityScope('created_by'));
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function refunder()
    {
        return $this->belongsTo(User::class, 'refunded_by');
    }

    public function paymentAccount()
    {
        return $this->belongsTo(PaymentAccount::class, 'payment_account_id');
    }
}

