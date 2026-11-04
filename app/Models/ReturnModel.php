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

    public function sale() { return $this->belongsTo(Sale::class, 'sale_id'); }
    public function processor() { return $this->belongsTo(User::class, 'processed_by'); }

    protected static function booted()
    {
        static::addGlobalScope(new \App\Models\Scopes\StaffActivityScope('processed_by'));
    }
}

