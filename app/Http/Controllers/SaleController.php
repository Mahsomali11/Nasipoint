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

        $eagerRelations = [
            'items.item:id,name',
            'customer',
            'stores',
            'cashier:id,name,full_name,email',
            'debt',
            'payments' => fn ($q) => $q->orderBy('created_at', 'asc'),
            'paymentAccount',
        ];

        // 1. Direct match on sales table by ID or receipt_no
        $sale = Sale::withoutGlobalScopes()
            ->with($eagerRelations)
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
                $sale = Sale::withoutGlobalScopes()->with($eagerRelations)->where('id', $debt->sale_id)->first();
            }
        }

        // 3. Fallback: fuzzy search receipt_no (e.g. if partial number or stripped prefix)
        if (!$sale) {
            $sale = Sale::withoutGlobalScopes()
                ->with($eagerRelations)
                ->where('receipt_no', 'like', "%{$target}%")
                ->first();
        }

        if (!$sale) {
            return response()->json([
                'success' => false,
                'error' => "Receipt details not found for reference: {$target}"
            ], 404);
        }

        // Check user access to this store using cached access
        $user = $request->user();
        if ($user) {
            $access = \App\Support\AccessCache::getUserAccess($user);
            $storeIdStr = (string) $sale->store_id;
            $isAdmin = $access['is_admin'];
            $isOwner = in_array($storeIdStr, $access['owned_store_ids'], true);
            $isStaff = isset($access['staff_roles_by_store'][$storeIdStr]);

            if (!$isAdmin && !$isOwner && !$isStaff) {
                return response()->json(['error' => 'Unauthorized access to this store receipt'], 403);
            }
        }

        // 4. Format eager-loaded line items (no N+1 queries)
        $formattedItems = [];
        foreach ($sale->items as $it) {
            $itemName = $it->item_name ?: ($it->item?->name ?? null);
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

        // 5-9. Use eager-loaded relationships
        $customer = $sale->customer;
        $store = $sale->stores;
        $cashier = $sale->cashier;
        $cashierName = $cashier ? ($cashier->full_name ?? $cashier->name) : ($user ? ($user->full_name ?? $user->name) : 'Staff');
        $debt = $sale->debt;
        $payments = $sale->payments;
        $account = $sale->paymentAccount;

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
