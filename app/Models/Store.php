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

    protected static function booted(): void
    {
        static::creating(function (Store $store) {
            $code = trim((string) ($store->store_code ?? ''));
            if ($code === '' || static::where('store_code', $code)->exists()) {
                $store->store_code = static::generateUniqueStoreCode();
            }
        });

        static::saving(function (Store $store) {
            $code = trim((string) ($store->store_code ?? ''));
            if ($code === '') {
                $store->store_code = static::generateUniqueStoreCode($store->id);
            }
        });

        static::saved(function (Store $store) {
            if (!empty($store->owner_user_id)) {
                \App\Support\AccessCache::clearUserAccess((string) $store->owner_user_id);
            }
        });

        static::created(function (Store $store) {
            try {
                $hasAccount = \App\Models\PaymentAccount::where('store_id', $store->id)->exists();
                if (!$hasAccount) {
                    \App\Models\PaymentAccount::create([
                        'id' => (string) \Illuminate\Support\Str::uuid(),
                        'store_id' => $store->id,
                        'account_name' => 'Cash',
                        'account_number' => '',
                        'provider_name' => '',
                        'account_type' => 'Cash',
                        'is_active' => true,
                    ]);
                }
            } catch (\Throwable $e) {
                // Non-fatal if payment_accounts table is unavailable
            }
        });

        static::deleted(function (Store $store) {
            if (!empty($store->owner_user_id)) {
                \App\Support\AccessCache::clearUserAccess((string) $store->owner_user_id);
            }
        });
    }

    /**
     * Generate a unique 5-digit System Store ID (10000 - 99999).
     */
    public static function generateUniqueStoreCode(?string $ignoreId = null): string
    {
        do {
            $code = (string) random_int(10000, 99999);
            $query = static::where('store_code', $code);
            if ($ignoreId) {
                $query->where('id', '!=', $ignoreId);
            }
        } while ($query->exists());

        return $code;
    }

    public function profiles() { return $this->belongsTo(User::class, 'owner_user_id'); }
}
