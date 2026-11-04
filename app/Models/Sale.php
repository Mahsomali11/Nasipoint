<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Sale extends Model
{
    use HasUuids;
    protected $guarded = [];

    protected $casts = [
        'subtotal' => 'float',
        'total' => 'float',
        'tax_amount' => 'float',
        'paid_amount' => 'float',
    ];

    public function stores() { return $this->belongsTo(Store::class, 'store_id'); }
    public function items() { return $this->hasMany(SaleItem::class, 'sale_id'); }
    public function customer() { return $this->belongsTo(Customer::class, 'customer_id'); }
    public function cashier() { return $this->belongsTo(User::class, 'staff_user_id'); }
    public function debt() { return $this->hasOne(CustomerDebt::class, 'sale_id')->withoutGlobalScopes(); }
    public function payments() { return $this->hasMany(Payment::class, 'sale_id')->withoutGlobalScopes(); }
    public function paymentAccount() { return $this->belongsTo(PaymentAccount::class, 'payment_account_id'); }

    protected static function booted()
    {
        static::addGlobalScope(new \App\Models\Scopes\StaffActivityScope('staff_user_id'));
    }
}

