<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ReturnItem extends Model
{
    use HasUuids;
    protected $guarded = [];
    protected $table = 'return_items';

    protected $casts = [
        'quantity' => 'float',
        'amount' => 'float',
    ];
}
