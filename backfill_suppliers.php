<?php

use App\Models\Expense;
use App\Models\Purchase;

$expenses = Expense::where('expense_type', 'Supplier Payment')->whereNull('supplier_id')->get();
foreach ($expenses as $expense) {
    if (preg_match('/Ref:\s*(SUP-\d+)/', $expense->note, $matches)) {
        // Unfortunately, the reference in the note is the payment reference (SUP- timestamp), not the purchase reference.
        // The Purchase itself doesn't have a linked payment table for supplier payments before this.
        // But maybe there is only one supplier in this test DB? Let's check.
    }
}
