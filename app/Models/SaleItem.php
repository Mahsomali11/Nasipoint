<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SaleItem extends Model
{
    use HasUuids;
    protected $guarded = [];

    protected $casts = [
        'quantity' => 'float',
        'cost_price' => 'float',
        'sell_price' => 'float',
        'line_total' => 'float',
        'tax_amount' => 'float',
    ];
}
