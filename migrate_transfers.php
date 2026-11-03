<?php

use App\Models\Payment;
use App\Models\AccountTransfer;

// Get all "out" transfers from payments table
$transfersOut = Payment::where('payment_type', 'transfer')
    ->where('direction', 'out')
    ->get();

foreach ($transfersOut as $outPayment) {
    // Check if it already exists in account_transfers
    $exists = AccountTransfer::where('reference', $outPayment->reference)->exists();
    if ($exists) {
        continue;
    }

    // Find the corresponding "in" payment
    $inPayment = Payment::where('payment_type', 'transfer')
        ->where('direction', 'in')
        ->where('reference', $outPayment->reference)
        ->first();

    if ($inPayment) {
        // Create the AccountTransfer record
        AccountTransfer::create([
            'store_id' => $outPayment->store_id,
            'from_account_id' => $outPayment->payment_account_id,
            'to_account_id' => $inPayment->payment_account_id,
            'amount' => $outPayment->amount,
            'reference' => $outPayment->reference,
            'notes' => 'Migrated from past transfer',
            'employee_user_id' => $outPayment->created_by,
            'employee_name' => 'Unknown', // We don't have the exact name easily accessible here unless we join users
            'created_at' => $outPayment->created_at,
            'updated_at' => $outPayment->updated_at,
        ]);
        echo "Migrated transfer " . $outPayment->reference . "\n";
    }
}
echo "Done!\n";
