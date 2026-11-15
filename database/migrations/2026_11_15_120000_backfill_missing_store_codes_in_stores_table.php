<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $existingCodes = DB::table('stores')
            ->whereNotNull('store_code')
            ->where('store_code', '!=', '')
            ->pluck('store_code')
            ->map(fn ($code) => trim((string) $code))
            ->filter(fn ($code) => $code !== '')
            ->flip()
            ->all();

        $storesMissingCode = DB::table('stores')
            ->where(function ($query) {
                $query->whereNull('store_code')
                    ->orWhereRaw("TRIM(store_code) = ''");
            })
            ->get(['id']);

        foreach ($storesMissingCode as $store) {
            do {
                $code = (string) random_int(10000, 99999);
            } while (isset($existingCodes[$code]));

            $existingCodes[$code] = true;

            DB::table('stores')
                ->where('id', $store->id)
                ->update(['store_code' => $code]);
        }

        try {
            Cache::flush();
        } catch (\Throwable $e) {
            // Ignore cache flush errors during CLI migration if cache table isn't ready
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // One-way data backfill; do not strip store_code values on rollback.
    }
};

