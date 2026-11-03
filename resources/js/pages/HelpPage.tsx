import { useState } from 'react';
import PageHeader from '@/components/PageHeader';
import { HelpCircle, Mail, MessageCircle, Info, ChevronDown, ChevronUp, Phone, Globe, BookOpen, Send, LifeBuoy } from 'lucide-react';

const faqs = [
  {
    category: 'Account & Login',
    icon: <LifeBuoy size={20} />,
    questions: [
      { q: 'How do I reset my password?', a: 'Go to the login screen and tap "Forgot password". Enter your email address and we\'ll send you a reset link. Click the link in your email to set a new password.' },
      { q: 'How do I create a new account?', a: 'On the login screen, tap "Create an account". Fill in your email, password, and business phone number. After creating your account, you\'ll be guided to set up your first store.' },
      { q: 'Can I use the same account for multiple stores?', a: 'Yes! One account can manage multiple stores. Use "Switch account" in the side menu to switch between your stores. Each store has its own isolated data.' },
      { q: 'How do I delete my account?', a: 'Open the side menu and tap "Delete your account" at the bottom. This action is permanent and will delete all your data. You\'ll be asked to confirm before proceeding.' },
    ],
  },
  {
    category: 'Sales & Payments',
    icon: <BookOpen size={20} />,
    questions: [
      { q: 'How do I process a sale?', a: 'Tap "START SALE" on the Dashboard. Search or scan items, add them to the cart, then tap Checkout. Choose the sale type (Cash/Credit/Mixed), payment method, and tap "Complete Sale".' },
      { q: 'What payment methods are supported?', a: 'Maaldhis supports Cash, M-Pesa (digital wallet), and Card payments. You can configure available payment methods in Preferences.' },
      { q: 'How do credit sales work?', a: 'Choose "Credit" or "Mixed" as the sale type during checkout. Select the customer and enter any amount paid now. The remaining balance is recorded as customer debt and can be collected later.' },
      { q: 'How do I collect customer payments?', a: 'Go to Credit Record → Customers Debt. Find the customer and tap to collect payment. Enter the amount and payment method. The debt balance updates automatically.' },
      { q: 'Can I void or cancel a sale?', a: 'Currently, you can process returns for completed sales. Go to Returns, search by receipt ID, and select items to return. The inventory and reports will be updated accordingly.' },
    ],
  },
  {
    category: 'Inventory & Stock',
    icon: <BookOpen size={20} />,
    questions: [
      { q: 'What\'s the difference between Products and Services?', a: 'Products have physical stock that gets deducted when sold. Services (like repairs) don\'t have stock quantities — they can be sold unlimited times without affecting inventory.' },
      { q: 'How do I set low stock alerts?', a: 'When adding or editing an item, set the "Low Stock Threshold". Items below this quantity will appear in red in your inventory, making them easy to spot.' },
      { q: 'How do stock transfers work?', a: 'Stock Transfers let you move inventory between your stores. Create a transfer, select items and quantities, and submit. Stock is deducted from the source and added to the destination once received.' },
      { q: 'How is profit calculated?', a: 'Profit per item = (Sell Price – Cost Price) × Quantity Sold. Net Profit = Total Gross Profit – Expenses – Losses. All calculations are based on actual transaction data.' },
    ],
  },
  {
    category: 'Reports & Data',
    icon: <BookOpen size={20} />,
    questions: [
      { q: 'What reports are available?', a: 'Sales Report (daily/monthly/all-time), Stock Report (inventory movements), Cash Flow (money in and out), Receipt History (searchable by date), and Expense tracking.' },
      { q: 'Can I export my data?', a: 'Yes! In the Inventory section, tap the export/download button to generate a report. Receipt History also supports exporting and sharing individual receipts.' },
      { q: 'How is Net Profit calculated?', a: 'Net Profit = Gross Sales Profit + Gross Credit Profit – Total Expenses – Total Losses. This gives you the true profitability of your business for any time period.' },
    ],
  },
  {
    category: 'Troubleshooting',
    icon: <BookOpen size={20} />,
    questions: [
      { q: 'The app is running slowly. What should I do?', a: 'Try clearing your browser cache and refreshing the page. If you have a large inventory, use the search feature instead of scrolling through all items.' },
      { q: 'I can\'t scan barcodes. What\'s wrong?', a: 'Make sure you\'ve allowed camera access in your browser settings. The barcode scanner works best in good lighting. You can always enter barcodes manually as a fallback.' },
      { q: 'My data seems incorrect. What should I check?', a: 'Verify that all items have correct cost and sell prices. Check that returns and voided sales are properly recorded. Review your expense entries for the period in question.' },
      { q: 'I accidentally deleted something. Can I undo it?', a: 'Deleted items cannot be recovered in the current version. We recommend being careful with delete actions. Future updates will include a recycle bin feature.' },
    ],
  },
];

export default function HelpPage() {
  const [expandedCategory, setExpandedCategory] = useState<string | null>('Account & Login');
  const [expandedQ, setExpandedQ] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-background pb-12">
      <PageHeader title="Help & Support" />
      
      <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-8">
        
        {/* Header Section */}
        <div className="text-center space-y-4 max-w-2xl mx-auto mb-10">
           <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto mb-6 text-primary border border-primary/20">
              <LifeBuoy size={32} />
           </div>
           <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground capitalize">How can we help?</h1>
           <p className="text-base text-muted-foreground font-medium">Find answers in our FAQ or reach out to our support team for assistance.</p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a href="mailto:support@Maaldhis.com" className="group bg-card rounded-3xl border border-border p-6 shadow-sm hover:shadow-md hover:border-primary/50 transition-all text-center flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <Mail size={24} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-primary transition-colors capitalize">Email Support</h3>
               <p className="text-sm font-medium text-muted-foreground">Send us a detailed message anytime.</p>
            </div>
          </a>
          
          <a href="https://wa.me/254700000000" target="_blank" rel="noopener noreferrer" className="group bg-card rounded-3xl border border-border p-6 shadow-sm hover:shadow-md hover:border-success/50 transition-all text-center flex flex-col items-center justify-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-success/10 flex items-center justify-center text-success group-hover:bg-success group-hover:text-success-foreground transition-colors">
              <MessageCircle size={24} />
            </div>
            <div>
               <h3 className="text-lg font-bold text-foreground mb-1 group-hover:text-success transition-colors capitalize">WhatsApp Support</h3>
               <p className="text-sm font-medium text-muted-foreground">Chat with us for quick assistance.</p>
            </div>
          </a>
        </div>

        {/* FAQ Sections */}
        <div>
          <h3 className="text-xl font-black text-foreground mb-6 flex items-center gap-2 capitalize">
             <HelpCircle size={24} className="text-primary" />
             Frequently Asked Questions
          </h3>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Categories Sidebar */}
            <div className="lg:col-span-1 space-y-2">
               {faqs.map(section => (
                  <button
                    key={section.category}
                    onClick={() => setExpandedCategory(section.category)}
                    className={`w-full p-4 rounded-2xl flex items-center justify-between text-left transition-all ${
                       expandedCategory === section.category
                         ? 'bg-primary text-primary-foreground shadow-md font-bold'
                         : 'bg-card border border-border text-foreground font-semibold hover:border-primary/50 hover:shadow-sm'
                    }`}
                  >
                     <div className="flex items-center gap-3">
                        <div className={expandedCategory === section.category ? 'text-primary-foreground' : 'text-muted-foreground'}>
                           {section.icon}
                        </div>
                        {section.category}
                     </div>
                     <span className={`text-[10px]  capitalize tracking-widest font-black px-2 py-0.5 rounded-lg ${
                        expandedCategory === section.category ? 'bg-background text-primary' : 'bg-muted text-muted-foreground'
                     }`}>
                        {section.questions.length} Qs
                     </span>
                  </button>
               ))}
            </div>

            {/* Questions List */}
            <div className="lg:col-span-2 space-y-4">
               {faqs.map(section => (
                 expandedCategory === section.category && (
                    <div key={section.category} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                       <h4 className="text-lg font-black text-foreground mb-4 pb-2 border-b border-border/50 capitalize">{section.category}</h4>
                       
                       {section.questions.map((faq, i) => (
                         <div key={i} className={`bg-card border rounded-2xl overflow-hidden transition-all ${expandedQ === faq.q ? 'border-primary shadow-md ring-4 ring-primary/5' : 'border-border shadow-sm hover:border-primary/50'}`}>
                           <button
                             onClick={() => setExpandedQ(expandedQ === faq.q ? null : faq.q)}
                             className="w-full p-5 flex items-start gap-4 text-left transition-colors"
                           >
                             <div className={`mt-0.5 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${expandedQ === faq.q ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                                <Info size={14} />
                             </div>
                             <span className={`text-base font-bold flex-1 ${expandedQ === faq.q ? 'text-primary' : 'text-foreground'}`}>{faq.q}</span>
                             <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-transform duration-200 ${expandedQ === faq.q ? 'bg-primary/10 text-primary rotate-180' : 'bg-muted text-muted-foreground'}`}>
                               <ChevronDown size={16} />
                             </div>
                           </button>
                           {expandedQ === faq.q && (
                             <div className="px-5 pb-6 pt-0 ml-10">
                               <p className="text-sm font-medium text-muted-foreground leading-relaxed pl-4 border-l-2 border-primary/20">
                                 {faq.a}
                               </p>
                             </div>
                           )}
                         </div>
                       ))}
                    </div>
                 )
               ))}
            </div>
          </div>
        </div>

        {/* Contact Info Footer */}
        <div className="bg-card rounded-3xl border border-border p-8 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
           <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                 <Globe size={28} className="text-muted-foreground" />
              </div>
              <div>
                 <h4 className="text-lg font-black text-foreground capitalize">Maaldhis POS</h4>
                 <p className="text-sm font-medium text-muted-foreground">Version 1.0.0 • © {new Date().getFullYear()} Maaldhis</p>
              </div>
           </div>
           
           <div className="flex gap-3">
              <a href="tel:+254700000000" className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm" title="Call Us">
                 <Phone size={20} />
              </a>
              <a href="mailto:support@Maaldhis.com" className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors shadow-sm" title="Email Us">
                 <Send size={20} />
              </a>
           </div>
        </div>

      </div>
    </div>
  );
}
