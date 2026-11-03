<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Item;
use Illuminate\Support\Str;

class ReturnController extends Controller
{
    public function processReturn(Request $request)
    {
        $request->validate([
            'saleId' => 'required',
            'items' => 'required|array',
            'refundMethod' => 'required',
            'storeId' => 'required'
        ]);

        $userId = $request->user()->id;

        try {
            DB::beginTransaction();

            $totalRefund = array_reduce($request->items, function ($sum, $i) {
                return $sum + $i['amount'];
            }, 0);

            // Rapid duplicate check (2 seconds)
            $recentReturn = DB::table('returns')
                ->where('store_id', $request->storeId)
                ->where('sale_id', $request->saleId)
                ->where('refund_amount', $totalRefund)
                ->where('created_at', '>=', now()->subSeconds(2))
                ->first();
            if ($recentReturn) {
                DB::rollBack();
                \Illuminate\Support\Facades\Log::info("ReturnController: Deduplicated duplicate return for sale {$request->saleId}");
                return response()->json(['success' => true, 'return_id' => $recentReturn->id]);
            }

            // 1. Create Return
            $returnId = (string) Str::uuid();
            DB::table('returns')->insert([
                'id' => $returnId,
                'store_id' => $request->storeId,
                'sale_id' => $request->saleId,
                'processed_by' => $userId,
                'refund_method' => $request->refundMethod,
                'refund_amount' => $totalRefund,
                'created_at' => now(),
                'updated_at' => now(),
            ]);

            // 2. Process Items
            foreach ($request->items as $i) {
                // Insert ReturnItem
                DB::table('return_items')->insert([
                    'id' => (string) Str::uuid(),
                    'return_id' => $returnId,
                    'sale_item_id' => $i['sale_item_id'],
                    'item_id' => $i['item_id'],
                    'quantity' => $i['quantity'],
                    'amount' => $i['amount'],
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // Restore Inventory
                $item = DB::table('items')->where('id', $i['item_id'])->first();
                if ($item && $item->type === 'product') {
                    DB::table('items')
                        ->where('id', $i['item_id'])
                        ->increment('quantity', $i['quantity']);
                }

                // Adjust Sale Item
                $saleItem = DB::table('sale_items')->where('id', $i['sale_item_id'])->first();
                if ($saleItem) {
                    $newQty = max(0, $saleItem->quantity - $i['quantity']);
                    $newLineTotal = max(0, $saleItem->line_total - $i['amount']);
                    DB::table('sale_items')
                        ->where('id', $i['sale_item_id'])
                        ->update([
                            'quantity' => $newQty,
                            'line_total' => $newLineTotal,
                            'updated_at' => now(),
                        ]);
                }
            }

            // 3. Adjust Sale
            $sale = DB::table('sales')->where('id', $request->saleId)->first();
            if ($sale) {
                $newSubtotal = max(0, $sale->subtotal - $totalRefund);
                $newTotal = max(0, $sale->total - $totalRefund);
                $newPaid = max(0, $sale->paid_amount - $totalRefund);
                
                // If it's a full return, mark as returned, otherwise leave status as is
                $status = $sale->status;
                // Check if remaining quantity across all sale items is 0
                $remainingItems = DB::table('sale_items')->where('sale_id', $sale->id)->sum('quantity');
                if ($remainingItems == 0) {
                    $status = 'returned';
                }

                DB::table('sales')
                    ->where('id', $request->saleId)
                    ->update([
                        'subtotal' => $newSubtotal,
                        'total' => $newTotal,
                        'paid_amount' => $newPaid,
                        'status' => $status,
                        'updated_at' => now(),
                    ]);
                
                // 4. Adjust Payments
                // To reflect correctly on Sales Report, we insert a negative payment
                DB::table('payments')->insert([
                    'id' => (string) Str::uuid(),
                    'store_id' => $request->storeId,
                    'sale_id' => $request->saleId,
                    'customer_id' => $sale->customer_id,
                    'payment_type' => 'sale', // Must be 'sale' to offset sale payments
                    'direction' => 'out', // Outgoing refund
                    'method' => $request->refundMethod,
                    'payment_account_id' => $sale->payment_account_id,
                    'amount' => -$totalRefund, // Negative amount to subtract from totals
                    'reference' => 'REFUND-' . substr($returnId, 0, 8),
                    'created_by' => $userId,
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                // 5. Adjust Credit if applicable
                if ($sale->sale_type === 'credit' || $sale->sale_type === 'mixed') {
                    $debt = DB::table('customer_debts')->where('sale_id', $request->saleId)->first();
                    if ($debt) {
                        $newBalance = max(0, $debt->balance_amount - $totalRefund);
                        $newOriginal = max(0, $debt->original_amount - $totalRefund);
                        $debtStatus = $newBalance == 0 ? 'paid' : 'partial';
                        DB::table('customer_debts')
                            ->where('id', $debt->id)
                            ->update([
                                'original_amount' => $newOriginal,
                                'balance_amount' => $newBalance,
                                'status' => $debtStatus,
                                'updated_at' => now()
                            ]);
                    }
                }
            }

            DB::commit();

            return response()->json(['message' => 'Return processed successfully']);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Failed to process return: ' . $e->getMessage()], 500);
        }
    }
}
