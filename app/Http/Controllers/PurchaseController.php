<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Purchase;
use App\Models\PurchaseItem;
use App\Models\Item;
use App\Models\Expense;
use Illuminate\Support\Str;

class PurchaseController extends Controller
{
    public function processPurchase(Request $request)
    {
        $request->validate([
            'store_id' => 'required|uuid',
            'supplier_id' => 'required|uuid',
            'payment_account_id' => 'nullable|uuid',
            'date' => 'required|date',
            'paid_amount' => 'numeric|min:0',
            'status' => 'required|in:pending,completed',
            'items' => 'required|array|min:1',
            'items.*.item_id' => 'required|uuid',
            'items.*.quantity' => 'required|numeric|min:0.01',
            'items.*.cost_price' => 'required|numeric|min:0',
            'items.*.sell_price' => 'nullable|numeric|min:0'
        ]);

        try {
            DB::beginTransaction();

            $totalAmount = 0;
            $itemsData = [];

            foreach ($request->items as $item) {
                $subtotal = $item['quantity'] * $item['cost_price'];
                $totalAmount += $subtotal;
                $itemsData[] = [
                    'id' => (string) Str::uuid(),
                    'item_id' => $item['item_id'],
                    'quantity' => $item['quantity'],
                    'cost_price' => $item['cost_price'],
                    'sell_price' => $item['sell_price'] ?? null,
                    'subtotal' => $subtotal,
                ];
            }

            // Rapid duplicate check (2 seconds)
            $recentPurchase = Purchase::where('store_id', $request->store_id)
                ->where('supplier_id', $request->supplier_id)
                ->where('total_amount', $totalAmount)
                ->where('created_at', '>=', now()->subSeconds(2))
                ->first();
            if ($recentPurchase) {
                DB::rollBack();
                \Illuminate\Support\Facades\Log::info("PurchaseController: Deduplicated duplicate purchase for store {$request->store_id}");
                return response()->json(Purchase::with('items')->find($recentPurchase->id), 201);
            }

            $paidAmount = $request->paid_amount ?? 0;
            if ($paidAmount >= $totalAmount) {
                $status = 'Completed';
            } else {
                $status = 'Pending';
            }

            $purchase = Purchase::create([
                'store_id' => $request->store_id,
                'supplier_id' => $request->supplier_id,
                'user_id' => $request->user()->id,
                'reference_no' => 'PUR-' . strtoupper(Str::random(8)),
                'date' => $request->date,
                'total_amount' => $totalAmount,
                'paid_amount' => $paidAmount,
                'payment_account_id' => $request->payment_account_id,
                'status' => $status,
                'notes' => $request->notes,
            ]);

            foreach ($itemsData as $itemData) {
                $purchaseItemPayload = $itemData;
                unset($purchaseItemPayload['sell_price']);
                $purchaseItemPayload['purchase_id'] = $purchase->id;
                PurchaseItem::create($purchaseItemPayload);

                if ($request->status === 'completed') {
                    $inventoryItem = Item::find($itemData['item_id']);
                    if ($inventoryItem) {
                            $existingQty = $inventoryItem->quantity ?? 0;
                            $existingCost = $inventoryItem->cost_price ?? 0;
                            $newQty = $itemData['quantity'];
                            $newCost = $itemData['cost_price'];
                            
                            $totalQty = $existingQty + $newQty;
                            
                            if ($totalQty > 0) {
                                $weightedCost = (($existingQty * $existingCost) + ($newQty * $newCost)) / $totalQty;
                                $inventoryItem->cost_price = round($weightedCost, 2);
                            } else {
                                $inventoryItem->cost_price = $newCost;
                            }
                        
                        if (isset($itemData['sell_price']) && is_numeric($itemData['sell_price'])) {
                            $inventoryItem->sell_price = $itemData['sell_price'];
                        }

                        $inventoryItem->quantity += $itemData['quantity'];
                        $inventoryItem->save();
                    }
                }
            }

            // Financial & Cash Flow Integration (Accounting Balance)
            if (($request->paid_amount ?? 0) > 0 && $request->payment_account_id) {
                $paymentAccount = \App\Models\PaymentAccount::find($request->payment_account_id);
                $accountName = $paymentAccount ? $paymentAccount->account_name : 'account';

                Expense::create([
                    'store_id' => $request->store_id,
                    'expense_type' => 'Purchase',
                    'amount' => $request->paid_amount,
                    'note' => 'Payment for Purchase ' . $purchase->reference_no,
                    'created_by' => $request->user()->id,
                    'employee_user_id' => $request->user()->id,
                    'employee_name' => $request->user()->full_name ?? $request->user()->name ?? 'Unknown',
                    'payment_account_id' => $request->payment_account_id,
                    'payment_method' => $accountName,
                ]);
            }

            DB::commit();

            return response()->json(Purchase::with('items')->find($purchase->id), 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function paySupplierDebt(Request $request)
    {
        $request->validate([
            'store_id' => 'required',
            'supplier_id' => 'required',
            'amount' => 'required|numeric|min:0.01',
            'payment_account_id' => 'required',
            'purchase_ids' => 'nullable|array'
        ]);

        try {
            DB::beginTransaction();

            $amountToPay = $request->amount;
            $supplierId = $request->supplier_id;

            // Rapid duplicate check (2 seconds)
            $recentExpense = Expense::where('store_id', $request->store_id)
                ->where('supplier_id', $supplierId)
                ->where('amount', $amountToPay)
                ->where('expense_type', 'Supplier Payment')
                ->where('created_at', '>=', now()->subSeconds(2))
                ->first();
            if ($recentExpense) {
                DB::rollBack();
                \Illuminate\Support\Facades\Log::info("PurchaseController: Deduplicated duplicate supplier debt payment for supplier {$supplierId}");
                return response()->json(['success' => true]);
            }

            $query = Purchase::where('supplier_id', $supplierId)
                ->where('store_id', $request->store_id)
                ->where('status', 'Pending')
                ->whereRaw('total_amount > paid_amount');

            if (!empty($request->purchase_ids)) {
                $query->whereIn('id', $request->purchase_ids);
            }

            $unpaidPurchases = $query->orderBy('date', 'asc')->get();

            $remaining = $amountToPay;
            foreach ($unpaidPurchases as $purchase) {
                if ($remaining <= 0) break;
                
                $due = $purchase->total_amount - $purchase->paid_amount;
                if ($remaining >= $due) {
                    $purchase->paid_amount = $purchase->total_amount;
                    $purchase->status = 'Completed';
                    $remaining -= $due;
                } else {
                    $purchase->paid_amount += $remaining;
                    $purchase->status = 'Pending';
                    $remaining = 0;
                }
                $purchase->save();
            }

            // Record Expense
            $paymentAccount = \App\Models\PaymentAccount::find($request->payment_account_id);
            $accountName = $paymentAccount ? $paymentAccount->account_name : 'account';

            Expense::create([
                'store_id' => $request->store_id,
                'expense_type' => 'Supplier Payment',
                'amount' => $amountToPay,
                'note' => 'Payment for Supplier Debt (Ref: ' . ($request->reference ?? 'Manual') . ')',
                'created_by' => $request->user()->id,
                'employee_user_id' => $request->user()->id,
                'employee_name' => $request->user()->full_name ?? $request->user()->name ?? 'Unknown',
                'supplier_id' => $supplierId,
                'payment_account_id' => $request->payment_account_id,
                'payment_method' => $accountName,
            ]);

            DB::commit();
            return response()->json(['success' => true]);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}
