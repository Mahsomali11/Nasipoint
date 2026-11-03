export const FEATURE_KEYS = {
  pos_sales: 'pos_sales',
  inventory: 'inventory',
  inventory_categories: 'inventory_categories',
  purchases: 'purchases',
  quick_add: 'quick_add',
  weighted_average_costing: 'weighted_average_costing',
  customers: 'customers',
  credit_sales: 'credit_sales',
  supplier_credit_records: 'supplier_credit_records',
  expenses: 'expenses',
  cash_flow: 'cash_flow',
  account_transfers: 'account_transfers',
  staff_accounts: 'staff_accounts',
  advanced_reports: 'advanced_reports',
  profit_loss: 'profit_loss',
  valuation_report: 'valuation_report',
  multi_store: 'multi_store',
  api_integrations: 'api_integrations',
  payment_integrations: 'payment_integrations',
  stock_transfers: 'stock_transfers',
  suppliers: 'suppliers',
  returns: 'returns',
  receipt_history: 'receipt_history',
  stock_report: 'stock_report',
  editable_price: 'editable_price',
} as const;

export type FeatureKey = keyof typeof FEATURE_KEYS;

export const FEATURE_GROUPS = [
  {
    name: 'Inventory Module',
    features: [
      { key: 'inventory', label: 'Item Management' },
      { key: 'inventory_categories', label: 'Categories & Subcategories' },
      { key: 'purchases', label: 'Purchases & Supplier Management' },
      { key: 'quick_add', label: 'Quick-Add Product during Purchase' },
      { key: 'weighted_average_costing', label: 'Weighted Average Cost Recalculation' },
      { key: 'stock_report', label: 'Stock Alerts & Low Stock Reports' },
      { key: 'stock_transfers', label: 'Stock Transfers' },
      { key: 'returns', label: 'Returns' },
      { key: 'suppliers', label: 'Supplier List Directory' },
    ]
  },
  {
    name: 'Sales & POS Module',
    features: [
      { key: 'pos_sales', label: 'POS Register / Start Sale' },
      { key: 'receipt_history', label: 'Sales Invoices & Receipts' },
      { key: 'editable_price', label: 'Editable Selling Price on Purchase' },
      { key: 'customers', label: 'Customer Management' },
    ]
  },
  {
    name: 'Financials & Accounts',
    features: [
      { key: 'cash_flow', label: 'Cash Flow (Inflow & Outflow)' },
      { key: 'account_transfers', label: 'Internal Account Transfers' },
      { key: 'payment_integrations', label: 'Payment Accounts (Cash / Merchant)' },
      { key: 'expenses', label: 'Expense Tracking' },
    ]
  },
  {
    name: 'Credit Records',
    features: [
      { key: 'credit_sales', label: 'Customer Credit Management & Settlement' },
      { key: 'supplier_credit_records', label: 'Supplier Credit Management & Settlement' },
    ]
  },
  {
    name: 'Analytics & Reports',
    features: [
      { key: 'advanced_reports', label: 'Daily/Monthly Sales Reports' },
      { key: 'profit_loss', label: 'Profit & Loss Statements' },
      { key: 'valuation_report', label: 'Inventory Cost Valuation Reports' },
    ]
  },
  {
    name: 'System & Integrations',
    features: [
      { key: 'staff_accounts', label: 'Staff Accounts' },
      { key: 'multi_store', label: 'Multi-Store Support' },
      { key: 'api_integrations', label: 'API Integrations' },
    ]
  }
];

// All available features with display labels, flattened for backwards compatibility
export const ALL_FEATURES: { key: FeatureKey; label: string }[] = FEATURE_GROUPS.flatMap(g => g.features) as { key: FeatureKey; label: string }[];

// Map routes to feature keys
export const ROUTE_FEATURE_MAP: Record<string, FeatureKey> = {
  '/start-sale': 'pos_sales',
  '/inventory': 'inventory',
  '/categories': 'inventory',
  '/purchases': 'purchases',
  '/customers': 'customers',
  '/credit-record': 'credit_sales',
  '/expenses': 'expenses',
  '/cash-flow': 'cash_flow',
  '/staff-accounts': 'staff_accounts',
  '/sales-report': 'advanced_reports',
  '/stock-transfers': 'stock_transfers',
  '/suppliers': 'suppliers',
  '/returns': 'returns',
  '/receipt-history': 'receipt_history',
  '/stock-report': 'stock_report',
  '/payment-accounts': 'payment_integrations',
};
