<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class Subscription extends Model
{
    use HasUuids;
    protected $guarded = [];


    //

    public function plans() { return $this->belongsTo(Plan::class, 'plan_id'); }
    public function stores() { return $this->belongsTo(Store::class, 'store_id'); }
}
