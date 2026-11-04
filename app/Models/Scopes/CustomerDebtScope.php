<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;


class CustomerDebtScope implements Scope
{
    public function apply(Builder $builder, Model $model)
    {
        $user = request()->user();
        if (!$user) {
            $user = auth()->guard('sanctum')->user();
        }
        if (!$user) return;

        // 1 & 2. Check cached user access (platform admin or owner of any store)
        $access = \App\Support\AccessCache::getUserAccess($user);
        if ($access['is_admin'] || $access['is_any_owner']) {
            return;
        }

        // 3. User is staff, restrict to customer debts created from their own sales
        $builder->whereHas('sale', function ($q) use ($user) {
            // Because Sale has StaffActivityScope, we just need to ensure the debt HAS a sale
            // But to be explicit and safe, we specify the condition
            $q->where('staff_user_id', $user->id);
        });
    }
}
