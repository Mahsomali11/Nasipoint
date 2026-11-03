<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Payment extends Model
{
    use HasUuids;
    protected $guarded = [];

    protected $casts = [
        'amount' => 'float',
    ];

    protected static function booted()
    {
        static::addGlobalScope(new \App\Models\Scopes\StaffActivityScope('created_by'));
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }
}

