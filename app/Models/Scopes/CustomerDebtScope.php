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

        // 1. Check if user is a platform admin
        $isAdmin = \Illuminate\Support\Facades\DB::table('admin_roles')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();

        if ($isAdmin) return;

        // 2. Check if user is an owner of any store
        $isOwner = \App\Models\Store::where('owner_user_id', $user->id)->exists();

        if ($isOwner) return;

        // 3. User is staff, restrict to customer debts created from their own sales
        $builder->whereHas('sale', function ($q) use ($user) {
            // Because Sale has StaffActivityScope, we just need to ensure the debt HAS a sale
            // But to be explicit and safe, we specify the condition
            $q->where('staff_user_id', $user->id);
        });
    }
}
