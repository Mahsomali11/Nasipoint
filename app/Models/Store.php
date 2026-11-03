<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Store extends Model
{
    use HasUuids;
    protected $guarded = [];

    protected $casts = [
        'features_enabled' => 'array',
        'is_active' => 'boolean',
    ];

    //

    public function profiles() { return $this->belongsTo(User::class, 'owner_user_id'); }
}
