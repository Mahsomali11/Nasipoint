<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Item extends Model
{
    use HasUuids;
    protected $guarded = [];

    protected $casts = [
        'cost_price' => 'float',
        'sell_price' => 'float',
        'quantity' => 'float',
    ];

    public function subCategory()
    {
        return $this->belongsTo(Category::class, 'sub_category_id');
    }
}
