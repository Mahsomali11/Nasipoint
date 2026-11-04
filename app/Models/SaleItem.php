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

    public function sale() { return $this->belongsTo(Sale::class, 'sale_id'); }
    public function item() { return $this->belongsTo(Item::class, 'item_id'); }
}
