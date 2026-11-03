<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

use Illuminate\Support\Facades\DB;
use App\Models\AccountTransfer;
use App\Models\Payment;
use Illuminate\Support\Str;

class TransferController extends Controller
{
    public function processTransfer(Request $request)
    {
        $request->validate([
            'store_id' => 'required|uuid',
            'from_account_id' => 'required|uuid',
            'to_account_id' => 'required|uuid|different:from_account_id',
            'amount' => 'required|numeric|min:0.01',
            'notes' => 'nullable|string'
        ]);

        try {
            DB::beginTransaction();

            // Rapid duplicate check (2 seconds)
            $recentTransfer = AccountTransfer::where('store_id', $request->store_id)
                ->where('from_account_id', $request->from_account_id)
                ->where('to_account_id', $request->to_account_id)
                ->where('amount', $request->amount)
                ->where('created_at', '>=', now()->subSeconds(2))
                ->first();
            if ($recentTransfer) {
                DB::rollBack();
                \Illuminate\Support\Facades\Log::info("TransferController: Deduplicated duplicate transfer for store {$request->store_id}");
                return response()->json(['success' => true, 'transfer' => $recentTransfer]);
            }

            $refNo = 'TRF-' . strtoupper(Str::random(8));
            $userId = $request->user()->id;
            $userName = $request->user()->full_name ?? $request->user()->name ?? 'Unknown';

            // Create the Transfer Record for History Log
            $transfer = AccountTransfer::create([
                'store_id' => $request->store_id,
                'from_account_id' => $request->from_account_id,
                'to_account_id' => $request->to_account_id,
                'amount' => $request->amount,
                'reference' => $refNo,
                'notes' => $request->notes,
                'employee_user_id' => $userId,
                'employee_name' => $userName,
            ]);

            // Create Outflow Payment for Source Account
            Payment::create([
                'store_id' => $request->store_id,
                'payment_type' => 'transfer',
                'direction' => 'out',
                'method' => 'other',
                'payment_account_id' => $request->from_account_id,
                'amount' => $request->amount,
                'reference' => $refNo,
                'created_by' => $userId,
            ]);

            // Create Inflow Payment for Destination Account
            Payment::create([
                'store_id' => $request->store_id,
                'payment_type' => 'transfer',
                'direction' => 'in',
                'method' => 'other',
                'payment_account_id' => $request->to_account_id,
                'amount' => $request->amount,
                'reference' => $refNo,
                'created_by' => $userId,
            ]);

            DB::commit();

            return response()->json(['success' => true, 'transfer' => $transfer]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Transfer failed: ' . $e->getMessage()], 500);
        }
    }
}
