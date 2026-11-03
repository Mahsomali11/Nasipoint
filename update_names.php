<?php
$transfers = \App\Models\AccountTransfer::where('employee_name', 'Unknown')->orWhereNull('employee_name')->get();
foreach ($transfers as $transfer) {
    if ($transfer->employee_user_id) {
        $user = \App\Models\User::find($transfer->employee_user_id);
        if ($user) {
            $name = $user->full_name ?? $user->name ?? 'Unknown';
            $transfer->update(['employee_name' => $name]);
            echo "Updated transfer {$transfer->reference} with name {$name}\n";
        }
    }
}
echo "Done!\n";
