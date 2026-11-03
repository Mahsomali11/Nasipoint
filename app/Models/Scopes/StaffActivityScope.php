<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

class StaffActivityScope implements Scope
{
    protected $column;

    public function __construct($column)
    {
        $this->column = $column;
    }

    public function apply(Builder $builder, Model $model)
    {
        $user = request()->user();
        if (!$user) {
            // Fallback just in case
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

        // 3. User is staff, restrict to their own activities
        $columns = (array) $this->column;
        $builder->where(function($q) use ($columns, $model, $user) {
            foreach ($columns as $index => $col) {
                if ($index === 0) {
                    $q->where($model->getTable() . '.' . $col, $user->id);
                } else {
                    $q->orWhere($model->getTable() . '.' . $col, $user->id);
                }
            }
        });
    }
}
