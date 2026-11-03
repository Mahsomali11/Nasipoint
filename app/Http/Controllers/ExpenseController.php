<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Expense;
use Carbon\Carbon;

class ExpenseController extends Controller
{
    /**
     * Check if the authenticated user has Admin or Owner permissions.
     */
    private function isUserAdminOrOwner(Request $request, Expense $expense): bool
    {
        $user = $request->user() ?? auth()->user();
        if (!$user) {
            return false;
        }

        // 1. Platform Admin check (admin_roles table)
        $isPlatformAdmin = DB::table('admin_roles')
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->exists();

        if ($isPlatformAdmin) {
            return true;
        }

        // 2. Store Owner check: user is owner of this expense's store
        $isStoreOwner = DB::table('stores')
            ->where('id', $expense->store_id)
            ->where('owner_user_id', $user->id)
            ->exists();

        if ($isStoreOwner) {
            return true;
        }

        // 3. User is owner of any store on platform
        $isAnyStoreOwner = DB::table('stores')
            ->where('owner_user_id', $user->id)
            ->exists();

        if ($isAnyStoreOwner) {
            return true;
        }

        // 4. Staff account check: check if the staff account has an 'admin' or 'owner' role in this store
        $isStaffAdmin = DB::table('staff_accounts')
            ->where('store_id', $expense->store_id)
            ->where('user_id', $user->id)
            ->where('is_active', true)
            ->whereIn('role', ['admin', 'owner'])
            ->exists();

        return $isStaffAdmin;
    }

    /**
     * Process an expense refund / reversal.
     */
    public function refundExpense(Request $request, $id = null)
    {
        $expenseId = $id ?? $request->input('expenseId') ?? $request->input('id');
        if (!$expenseId) {
            return response()->json(['error' => 'Expense ID is required.'], 422);
        }

        $request->validate([
            'reason' => 'required|string|max:500',
            'refundAmount' => 'nullable|numeric|min:0.01',
            'paymentAccountId' => 'nullable|string',
        ]);

        $userId = $request->user()?->id ?? auth()->id();
        $expense = Expense::withoutGlobalScope(\App\Models\Scopes\StaffActivityScope::class)->findOrFail($expenseId);

        // RBAC check: only Store Owners and Admins can refund / reverse expenses
        if (!$this->isUserAdminOrOwner($request, $expense)) {
            return response()->json([
                'success' => false,
                'error' => 'Forbidden: Only Store Owners and Admins are permitted to refund or reverse expenses.',
            ], 403);
        }

        if ($expense->status === 'reversed') {
            return response()->json([
                'message' => 'Expense has already been reversed / refunded.',
                'expense' => $expense->load(['user', 'refunder', 'paymentAccount'])
            ], 200);
        }

        $refundAmount = $request->filled('refundAmount')
            ? (float) $request->refundAmount
            : (float) $expense->amount;

        try {
            DB::beginTransaction();

            $updates = [
                'status' => 'reversed',
                'refund_reason' => $request->reason,
                'refund_amount' => $refundAmount,
                'refunded_at' => now(),
                'refunded_by' => $userId,
            ];

            // If user explicitly chose a refund payment account
            if ($request->filled('paymentAccountId')) {
                $updates['payment_account_id'] = $request->paymentAccountId;
            }

            $expense->update($updates);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Expense successfully reversed and refunded.',
                'expense' => $expense->fresh(['user', 'refunder', 'paymentAccount']),
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Failed to reverse expense: ' . $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Edit an active expense (e.g. within active day/shift).
     */
    public function update(Request $request, $id)
    {
        $expense = Expense::withoutGlobalScope(\App\Models\Scopes\StaffActivityScope::class)->findOrFail($id);

        // RBAC check: only Store Owners and Admins can edit expenses
        if (!$this->isUserAdminOrOwner($request, $expense)) {
            return response()->json([
                'success' => false,
                'error' => 'Forbidden: Only Store Owners and Admins are permitted to edit expenses.',
            ], 403);
        }

        if ($expense->status === 'reversed') {
            return response()->json(['error' => 'Reversed expenses cannot be edited.'], 422);
        }

        $validated = $request->validate([
            'expense_type' => 'sometimes|string|max:255',
            'amount' => 'sometimes|numeric|min:0.01',
            'note' => 'nullable|string|max:500',
            'payment_method' => 'sometimes|string',
            'payment_account_id' => 'nullable|string',
        ]);

        $expense->update($validated);

        return response()->json([
            'success' => true,
            'expense' => $expense->fresh(['user', 'refunder', 'paymentAccount']),
        ]);
    }

    /**
     * Delete an active expense if permitted.
     */
    public function destroy(Request $request, $id)
    {
        $expense = Expense::withoutGlobalScope(\App\Models\Scopes\StaffActivityScope::class)->findOrFail($id);

        // RBAC check: only Store Owners and Admins can delete expenses
        if (!$this->isUserAdminOrOwner($request, $expense)) {
            return response()->json([
                'success' => false,
                'error' => 'Forbidden: Only Store Owners and Admins are permitted to delete expenses.',
            ], 403);
        }

        $expense->delete();

        return response()->json([
            'success' => true,
            'message' => 'Expense deleted successfully.',
        ]);
    }
}
