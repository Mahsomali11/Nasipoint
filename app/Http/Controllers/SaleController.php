<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Sale;
use App\Models\CustomerDebt;

class SaleController extends Controller
{
    /**
     * Get full receipt details by sale ID, receipt reference number (RCP-...), or debt ID.
     */
    public function getReceiptDetails(Request $request, $identifier = null)
    {
        $target = $identifier 
            ?? $request->query('reference') 
            ?? $request->query('receipt_no') 
            ?? $request->query('sale_id') 
            ?? $request->input('reference')
            ?? $request->input('sale_id');

        if (!$target) {
            return response()->json(['error' => 'Receipt reference or sale ID is required'], 400);
        }

        // Clean target
        $target = trim($target);

        // 1. Direct match on sales table by ID or receipt_no
        $sale = Sale::withoutGlobalScopes()
            ->where(function ($q) use ($target) {
                $q->where('id', $target)
                  ->orWhere('receipt_no', $target);
            })
            ->first();

        // 2. If not found directly, check customer_debts table
        if (!$sale) {
            $debt = CustomerDebt::withoutGlobalScopes()
                ->where('id', $target)
                ->orWhere('sale_id', $target)
                ->orWhere('notes', 'like', "%{$target}%")
                ->first();

            if ($debt && !empty($debt->sale_id)) {
                $sale = Sale::withoutGlobalScopes()->where('id', $debt->sale_id)->first();
            }
        }

        // 3. Fallback: fuzzy search receipt_no (e.g. if partial number or stripped prefix)
        if (!$sale) {
            $sale = Sale::withoutGlobalScopes()
                ->where('receipt_no', 'like', "%{$target}%")
                ->first();
        }

        if (!$sale) {
            return response()->json([
                'success' => false,
                'error' => "Receipt details not found for reference: {$target}"
            ], 404);
        }

        // Check user access to this store
        $user = $request->user();
        if ($user) {
            $isAdmin = DB::table('admin_roles')->where('user_id', $user->id)->where('is_active', true)->exists();
            $isOwner = DB::table('stores')->where('id', $sale->store_id)->where('owner_user_id', $user->id)->exists();
            $isStaff = DB::table('staff_accounts')->where('store_id', $sale->store_id)->where('user_id', $user->id)->where('is_active', true)->exists();

            if (!$isAdmin && !$isOwner && !$isStaff) {
                return response()->json(['error' => 'Unauthorized access to this store receipt'], 403);
            }
        }

        // 4. Fetch line items
        $items = DB::table('sale_items')->where('sale_id', $sale->id)->get();
        $formattedItems = [];

        foreach ($items as $it) {
            $itemName = $it->item_name;
            if (empty($itemName) && !empty($it->item_id)) {
                $prod = DB::table('items')->where('id', $it->item_id)->first();
                if ($prod) {
                    $itemName = $prod->name;
                }
            }

            $qty = (float)($it->quantity ?? 1);
            $sellPrice = (float)($it->sell_price ?? 0);
            $costPrice = (float)($it->cost_price ?? 0);
            $lineTotal = isset($it->line_total) && (float)$it->line_total > 0 
                ? (float)$it->line_total 
                : round($qty * $sellPrice, 2);

            $formattedItems[] = [
                'id' => $it->id,
                'sale_id' => $it->sale_id,
                'item_id' => $it->item_id,
                'item_name' => $itemName ?: 'Product Item',
                'quantity' => $qty,
                'sell_price' => $sellPrice,
                'cost_price' => $costPrice,
                'line_total' => $lineTotal,
                'created_at' => $it->created_at ?? null,
            ];
        }

        // 5. Fetch Customer details
        $customer = null;
        if (!empty($sale->customer_id)) {
            $customer = DB::table('customers')->where('id', $sale->customer_id)->first();
        }

        // 6. Fetch Store details
        $store = DB::table('stores')->where('id', $sale->store_id)->first();

        // 7. Fetch Cashier details
        $cashier = null;
        if (!empty($sale->staff_user_id)) {
            $cashier = DB::table('users')->where('id', $sale->staff_user_id)->select('id', 'name', 'full_name', 'email')->first();
        }
        $cashierName = $cashier ? ($cashier->full_name ?? $cashier->name) : ($user ? ($user->full_name ?? $user->name) : 'Staff');

        // 8. Fetch Associated Customer Debt (if credit / split sale)
        $debt = CustomerDebt::withoutGlobalScopes()
            ->where('sale_id', $sale->id)
            ->first();

        // 9. Fetch Payments & Settlements
        $payments = DB::table('payments')
            ->where('sale_id', $sale->id)
            ->orderBy('created_at', 'asc')
            ->get();

        // Determine payment account & method
        $account = null;
        if (!empty($sale->payment_account_id)) {
            $account = DB::table('payment_accounts')->where('id', $sale->payment_account_id)->first();
        }

        $salePayment = $payments->firstWhere('payment_type', 'sale');
        if (!$account && $salePayment && !empty($salePayment->payment_account_id)) {
            $account = DB::table('payment_accounts')->where('id', $salePayment->payment_account_id)->first();
        }

        $paymentMethod = $account 
            ? $account->account_name 
            : ($salePayment ? $salePayment->method : ($sale->sale_type ?: 'Cash'));

        // Computed Breakdown
        $subtotal = (float)$sale->subtotal;
        $discount = (float)$sale->discount;
        $tax = (float)$sale->tax;
        $total = (float)$sale->total;
        $paidAmount = (float)$sale->paid_amount;
        $currentBalanceDue = $debt ? (float)$debt->balance_amount : (float)$sale->outstanding_amount;
        $isSettled = $currentBalanceDue <= 0.0001;

        return response()->json([
            'success' => true,
            'sale' => $sale,
            'items' => $formattedItems,
            'customer' => $customer,
            'store' => $store,
            'cashierName' => $cashierName,
            'paymentMethod' => $paymentMethod,
            'payments' => $payments,
            'debt' => $debt,
            'breakdown' => [
                'subtotal' => $subtotal,
                'discount' => $discount,
                'tax' => $tax,
                'tax_rate' => (float)($sale->tax_rate ?? 0),
                'total' => $total,
                'paid_at_sale' => $paidAmount,
                'original_debt' => $debt ? (float)$debt->original_amount : (float)$sale->outstanding_amount,
                'current_balance_due' => $currentBalanceDue,
                'is_settled' => $isSettled,
                'status' => $isSettled ? 'Paid in Full' : 'Active Debt',
            ]
        ]);
    }
}
