// Types for the Maaldhis POS system
export interface Category {
  id: string;
  store_id: string;
  name: string;
  description?: string;
  created_at: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  phone: string;
  created_at: string;
}

export interface Store {
  id: string;
  owner_user_id: string;
  store_name: string;
  store_code: string;
  location: string;
  phone: string;
  currency: string;
  logo_url: string;
  show_logo_on_receipt: boolean;
  receipt_thank_you_message: string;
  receipt_footer_text: string;
  receipt_template?: string;
  primary_color?: string;
  secondary_color?: string;
  country?: string;
  tax_enabled?: boolean;
  tax_rate?: number;
  low_stock_threshold?: number;
  created_at: string;
}

export interface StoreUser {
  id: string;
  store_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'cashier' | 'inventory_manager';
  is_active: boolean;
}

export interface Customer {
  id: string;
  store_id: string;
  customer_code: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface Supplier {
  id: string;
  store_id: string;
  supplier_code: string;
  name: string;
  phone: string;
  address: string;
  created_at: string;
}

export interface Item {
  id: string;
  store_id: string;
  item_code: string;
  name: string;
  category: string;
  sub_category_id?: string | null;
  sub_category?: Category | null;
  type: 'product' | 'service';
  barcode: string;
  cost_price: number;
  sell_price: number;
  quantity: number;
  low_stock_threshold: number;
  is_active: boolean;
  image_path?: string;
  created_at: string;
}

export interface Sale {
  id: string;
  store_id: string;
  receipt_no: string;
  customer_id: string | null;
  staff_user_id: string;
  sale_type: 'cash' | 'credit' | 'mixed';
  subtotal: number;
  discount: number;
  tax: number;
  tax_rate?: number;
  total: number;
  paid_amount: number;
  outstanding_amount: number;
  status: 'completed' | 'voided' | 'returned';
  payment_account_id?: string | null;
  sold_at: string;
}

export interface SaleItem {
  id: string;
  sale_id: string;
  item_id: string;
  item_name?: string;
  quantity: number;
  cost_price: number;
  sell_price: number;
  line_total: number;
}

export interface Payment {
  id: string;
  store_id: string;
  sale_id: string | null;
  customer_id: string | null;
  supplier_id: string | null;
  payment_type: string;
  direction: 'in' | 'out';
  method: 'cash' | 'mpesa' | 'card' | 'bank' | 'other';
  payment_account_id?: string | null;
  amount: number;
  reference: string;
  created_by: string;
  created_at: string;
  user?: { name?: string; full_name?: string };
}

export interface Expense {
  id: string;
  store_id: string;
  expense_type: string;
  amount: number;
  status?: 'active' | 'reversed';
  refund_amount?: number;
  refund_reason?: string | null;
  refunded_at?: string | null;
  refunded_by?: string | null;
  note: string;
  employee_user_id: string | null;
  employee_name?: string;
  supplier_id?: string | null;
  payment_method: string;
  payment_account_id?: string | null;
  created_by: string;
  created_at: string;
  user?: { name?: string; full_name?: string };
  refunder?: { name?: string; full_name?: string };
}

export interface Return {
  id: string;
  store_id: string;
  sale_id: string;
  processed_by: string;
  refund_method: string;
  refund_amount: number;
  created_at: string;
  items?: ReturnItem[];
}

export interface ReturnItem {
  id: string;
  return_id: string;
  sale_item_id: string;
  item_id: string;
  quantity: number;
  amount: number;
}

export interface CashSession {
  id: string;
  store_id: string;
  business_date: string;
  opening_cash: number;
  closing_cash: number;
  opened_by: string;
  closed_by: string | null;
  created_at: string;
}

export interface CashMovement {
  id: string;
  store_id: string;
  cash_session_id: string;
  movement_type: string;
  direction: 'in' | 'out';
  amount: number;
  source_module: string;
  reference_id: string;
  note: string;
  created_at: string;
}

export interface StockTransfer {
  id: string;
  source_store_id: string;
  destination_store_id: string;
  status: 'pending' | 'approved' | 'received' | 'cancelled';
  requested_by: string;
  approved_by: string | null;
  received_by: string | null;
  created_at: string;
  items?: StockTransferItem[];
}

export interface StockTransferItem {
  id: string;
  stock_transfer_id: string;
  item_id: string;
  quantity: number;
}

export interface CustomerDebt {
  id: string;
  store_id: string;
  customer_id: string;
  customer_name?: string;
  customer_phone?: string;
  sale_id: string | null;
  original_amount: number;
  balance_amount: number;
  status: 'open' | 'partial' | 'paid';
  notes?: string | null;
  created_at: string;
}

export interface CartItem {
  item: Item;
  quantity: number;
  line_total: number;
}

export interface StaffAccount {
  id: string;
  store_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'owner' | 'admin' | 'cashier' | 'inventory_manager';
  is_active: boolean;
  created_at: string;
}

export interface Purchase {
  id: string;
  store_id: string;
  reference_no: string;
  supplier_id: string | null;
  user_id: string | null;
  date: string;
  total_amount: number;
  paid_amount: number;
  payment_account_id: string | null;
  status: 'pending' | 'completed' | 'Pending' | 'Completed';
  notes?: string;
  created_at: string;
  items?: PurchaseItem[];
}

export interface PurchaseItem {
  id: string;
  purchase_id: string;
  item_id: string;
  quantity: number;
  cost_price: number;
  subtotal: number;
}
