<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class SupportTicket extends Model
{
    use HasUuids;
    protected $guarded = [];


    //

    public function stores() { return $this->belongsTo(Store::class, 'store_id'); }
    public function profiles() { return $this->belongsTo(User::class, 'user_id'); }
}
