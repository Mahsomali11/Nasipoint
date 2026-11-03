<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class CustomerDebt extends Model
{
    use HasUuids;
    protected $guarded = [];

    protected $casts = [
        'original_amount' => 'float',
        'balance_amount' => 'float',
    ];

    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }

    protected static function booted()
    {
        static::addGlobalScope(new \App\Models\Scopes\CustomerDebtScope());
    }
}
