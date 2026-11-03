import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { BookOpen, ShoppingCart, Package, Receipt, CreditCard, ArrowLeftRight, BarChart3, ChevronDown, ChevronUp, DollarSign, Users, RotateCcw, Settings, Lightbulb, PlayCircle } from 'lucide-react';

const topics = [
  {
    title: 'How to Start a Sale',
    icon: ShoppingCart,
    description: 'Learn to use the POS system to process sales quickly.',
    steps: [
      'From the Dashboard, tap the large "START SALE" button.',
      'Search for items by name, item code, or barcode — or tap the barcode icon to scan with your camera.',
      'Tap the + button next to each item to add it to the cart. Use – to reduce quantity.',
      'When ready, tap "Checkout" at the bottom of the screen.',
      'Choose the Sale Type: Cash, Credit, or Mixed.',
      'For Credit or Mixed sales, select a customer and enter the amount paid now.',
      'Choose a Payment Method: Cash, M-Pesa, or Card.',
      'Tap "Complete Sale" — a receipt is generated, inventory is deducted, and reports are updated automatically.',
    ],
    tip: 'Service items (like phone repair) don\'t reduce stock — only product items do.',
  },
  {
    title: 'How to Add Inventory',
    icon: Package,
    description: 'Add products and services to your inventory.',
    steps: [
      'Go to Inventory from the Dashboard or bottom navigation.',
      'Tap the + floating button at the bottom right.',
      'Fill in the item details: Name, Type (Product or Service), Cost Price, Sell Price, Quantity, Barcode (optional), and Low Stock Threshold.',
      'Tap "Add Item" to save.',
      'Your new item will appear in the inventory list and be available during sales.',
      'Use the search bar to quickly find items by name or barcode.',
      'Tap the history icon on any item to see its stock movement history.',
    ],
    tip: 'Set a low stock threshold so items show in red when stock is running low.',
  },
  {
    title: 'How to Record Expenses',
    icon: Receipt,
    description: 'Track business expenses for accurate profit reporting.',
    steps: [
      'Go to Expenses from the Dashboard.',
      'Tap the + floating button to add a new expense.',
      'Enter the expense type (e.g., Rent, Transport, Supplies), amount, and optional note.',
      'Select the payment method used (Cash, M-Pesa, Card).',
      'Tap "Add Expense" to save.',
      'The expense appears in today\'s expense list and updates your daily totals.',
      'Tap "Expense History" to view expenses from previous days.',
    ],
    tip: 'All expenses are automatically deducted from your Net Profit in the Sales Report.',
  },
  {
    title: 'How Credit Sales Work',
    icon: CreditCard,
    description: 'Understand credit sales and customer debt tracking.',
    steps: [
      'During a sale, choose "Credit" or "Mixed" as the Sale Type.',
      'Select the customer who is buying on credit.',
      'For Mixed sales, enter the amount the customer is paying now — the rest becomes debt.',
      'The outstanding amount is automatically recorded under Credit Record → Customers Debt.',
      'When a customer comes to pay, go to Credit Record, find their name, and tap "Collect Payment".',
      'Enter the payment amount and method — the debt balance updates automatically.',
      'Fully paid debts are marked as "Paid" and no longer count toward total owed.',
    ],
    tip: 'You can also track money YOUR business owes to others under the "Your Debt" tab.',
  },
  {
    title: 'How Stock Transfers Work',
    icon: ArrowLeftRight,
    description: 'Transfer inventory between your stores.',
    steps: [
      'Go to Stock Transfers from the Dashboard.',
      'This feature is for businesses with multiple stores.',
      'Tap + to create a new transfer — select the destination store.',
      'Choose items and quantities to transfer.',
      'Submit the transfer — stock is deducted from your current store.',
      'The destination store receives the stock once the transfer is confirmed.',
      'Transfer history is recorded for both stores.',
    ],
    tip: 'Transfers go through statuses: Pending → Approved → Received. Both stores can track progress.',
  },
  {
    title: 'How Reports Are Calculated',
    icon: BarChart3,
    description: 'Understand your sales, profit, and financial reports.',
    steps: [
      'Go to Sales Report from the Dashboard or bottom navigation.',
      'Switch between Today, This Month, and All Time tabs.',
      'Key metrics explained:',
      '• Total Sales Revenue = total from all completed sales.',
      '• Gross Sales Profit = (Sell Price – Cost Price) × Qty for cash sales.',
      '• Gross Credit Profit = same formula but for credit sales.',
      '• Expenses = total expenses in the selected period.',
      '• Net Profit = Gross Sales Profit + Gross Credit Profit – Expenses – Losses.',
      '• Total Items Sold = total quantity of items sold.',
      'Payment breakdowns show how much came via Cash, M-Pesa, and Card.',
    ],
    tip: 'Reports are always calculated from real transactions — they update in real time as you make sales.',
  },
  {
    title: 'How to Process Returns',
    icon: RotateCcw,
    description: 'Handle product returns and refunds correctly.',
    steps: [
      'Go to Returns from the Dashboard.',
      'Search for the original sale using the Receipt ID.',
      'Select which items the customer is returning and the quantities.',
      'Choose the refund method: Cash, M-Pesa, Card, or Store Credit.',
      'Confirm the return — stock is automatically added back for product items.',
      'The sales report and profit calculations are updated to reflect the return.',
      'The return event is recorded in Receipt History for audit purposes.',
    ],
    tip: 'You cannot return more items than were originally sold on that receipt.',
  },
  {
    title: 'How Cash Flow Works',
    icon: DollarSign,
    description: 'Track all money coming in and going out of your business.',
    steps: [
      'Go to Cash Flow from the Dashboard.',
      'Set your Opening Cash at the start of each day.',
      'Throughout the day, the system automatically tracks:',
      '• Cash In: Cash sales, customer debt collections, loans received.',
      '• Cash Out: Expenses, refunds, loan repayments.',
      'Use the "Cash In" and "Cash Out" buttons for manual entries (e.g., petty cash).',
      'Closing Cash is calculated automatically based on all movements.',
      'Tap the history icon to review cash flow from previous days.',
    ],
    tip: 'Formula: Closing Cash = Opening Cash + All Cash In – All Cash Out.',
  },
  {
    title: 'Managing Customers & Suppliers',
    icon: Users,
    description: 'Keep track of your business contacts.',
    steps: [
      'Go to Customers or Suppliers from the Dashboard.',
      'Tap + to add a new contact with name, phone, and address.',
      'Customer profiles show purchase history, outstanding debts, and payment records.',
      'Supplier profiles track items supplied, unpaid balances, and supply history.',
      'Use the search bar to quickly find contacts by name or phone number.',
      'Link customers to sales for better record keeping and debt tracking.',
    ],
    tip: 'Adding customers before making credit sales helps you track debts accurately.',
  },
  {
    title: 'App Settings & Preferences',
    icon: Settings,
    description: 'Customize Maaldhis for your business.',
    steps: [
      'Open the side menu and tap Preferences.',
      'Available settings include:',
      '• Currency — change the display currency (default: KSh).',
      '• Payment Methods — configure which methods you accept.',
      '• Tax/VAT — toggle tax calculations on or off.',
      '• Receipt Footer — customize text printed on receipts.',
      '• Low Stock Threshold — set default warning levels.',
      '• Theme — switch between light and dark mode.',
      'Changes apply immediately across all screens.',
    ],
    tip: 'Set up your preferences when you first create your store for the best experience.',
  },
];

export default function LearningCenterPage() {
  const [expanded, setExpanded] = useState<string | null>(topics[0].title);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader title="Learning Center" />
      
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-10">
           <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary border border-primary/20">
              <BookOpen size={32} />
           </div>
           <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground capitalize">Master Maaldhis</h1>
           <p className="text-base text-muted-foreground font-medium">Explore step-by-step guides and tutorials to get the most out of your POS system.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
           
           {/* Sidebar topics list */}
           <div className="lg:col-span-1 space-y-2">
             <h3 className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest mb-4 px-2">Tutorial Topics</h3>
             {topics.map(topic => (
               <button
                 key={topic.title}
                 onClick={() => setExpanded(topic.title)}
                 className={`w-full p-4 rounded-2xl flex items-center gap-3 text-left transition-all ${
                    expanded === topic.title
                      ? 'bg-primary text-primary-foreground shadow-md font-bold'
                      : 'bg-card border border-border text-foreground font-semibold hover:border-primary/50 hover:shadow-sm'
                 }`}
               >
                 <div className={expanded === topic.title ? 'text-primary-foreground' : 'text-muted-foreground'}>
                    <topic.icon size={20} />
                 </div>
                 <span className="flex-1 line-clamp-1">{topic.title}</span>
               </button>
             ))}
           </div>

           {/* Content Area */}
           <div className="lg:col-span-2">
              {topics.map(topic => (
                 expanded === topic.title && (
                    <div key={topic.title} className="bg-card rounded-3xl border border-border shadow-lg overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
                       
                       {/* Header */}
                       <div className="p-8 border-b border-border bg-muted/10">
                          <div className="flex items-center gap-4 mb-4">
                             <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                <topic.icon size={28} />
                             </div>
                             <div>
                                <h2 className="text-2xl font-black text-foreground capitalize">{topic.title}</h2>
                                <p className="text-sm font-medium text-muted-foreground mt-1">{topic.description}</p>
                             </div>
                          </div>
                       </div>

                       {/* Steps */}
                       <div className="p-8 space-y-8">
                          <div>
                             <h3 className="text-[11px] font-bold text-muted-foreground  capitalize tracking-widest mb-6 flex items-center gap-2">
                                <PlayCircle size={14} className="text-primary" /> Step-by-Step Guide
                             </h3>
                             <ol className="space-y-6">
                                {topic.steps.map((step, i) => (
                                   <li key={i} className="flex gap-4">
                                      {step.startsWith('•') ? (
                                         <div className="flex items-start gap-4">
                                            <div className="w-6 h-6 flex items-center justify-center shrink-0">
                                               <div className="w-2 h-2 rounded-full bg-muted-foreground/30"></div>
                                            </div>
                                            <span className="text-sm font-medium text-muted-foreground pt-0.5">{step}</span>
                                         </div>
                                      ) : (
                                         <>
                                            <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border shadow-sm">
                                               <span className="text-xs font-black text-foreground">{i + 1}</span>
                                            </div>
                                            <span className="text-sm font-semibold text-foreground pt-0.5 leading-relaxed">{step}</span>
                                         </>
                                      )}
                                   </li>
                                ))}
                             </ol>
                          </div>

                          {/* Pro Tip */}
                          {topic.tip && (
                             <div className="bg-info/10 border border-info/20 rounded-2xl p-6 flex gap-4">
                                <div className="w-10 h-10 rounded-xl bg-info/20 flex items-center justify-center text-info shrink-0">
                                   <Lightbulb size={20} />
                                </div>
                                <div>
                                   <h4 className="text-xs font-bold text-info  capitalize tracking-widest mb-1">Pro Tip</h4>
                                   <p className="text-sm font-medium text-info/90 leading-relaxed">{topic.tip}</p>
                                </div>
                             </div>
                          )}
                       </div>
                    </div>
                 )
              ))}
           </div>
        </div>

      </div>
    </div>
  );
}
