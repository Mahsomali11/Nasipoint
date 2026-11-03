<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StockTransfer extends Model
{
    use HasUuids;
    protected $guarded = [];


    //

    protected static function booted()
    {
        static::addGlobalScope(new \App\Models\Scopes\StaffActivityScope(['requested_by', 'approved_by', 'received_by']));
    }
}

