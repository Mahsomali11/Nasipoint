<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class StockTransfer extends Model
{
    use HasUuids;
    protected $guarded = [];


    public function sourceStore() { return $this->belongsTo(Store::class, 'source_store_id'); }
    public function destinationStore() { return $this->belongsTo(Store::class, 'destination_store_id'); }
    public function item() { return $this->belongsTo(Item::class, 'item_id'); }

    protected static function booted()
    {
        static::addGlobalScope(new \App\Models\Scopes\StaffActivityScope(['requested_by', 'approved_by', 'received_by']));
    }
}

