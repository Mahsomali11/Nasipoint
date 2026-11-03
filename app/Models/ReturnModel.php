<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class ReturnModel extends Model
{
    use HasUuids;
    protected $guarded = [];
    protected $table = 'returns';

    protected $casts = [
        'refund_amount' => 'float',
    ];

    protected static function booted()
    {
        static::addGlobalScope(new \App\Models\Scopes\StaffActivityScope('processed_by'));
    }
}

