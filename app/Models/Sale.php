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

    protected static function booted()
    {
        static::addGlobalScope(new \App\Models\Scopes\StaffActivityScope('staff_user_id'));
    }
}

