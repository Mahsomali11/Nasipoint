import type { Sale, SaleItem, Customer, Store } from '@/types';

interface ReceiptData {
  sale: Sale;
  items: SaleItem[];
  customer: Customer | null;
  store: Store;
  cashierName: string;
  formatCurrency: (amount: number) => string;
  paymentMethod?: string;
  footerText?: string;
}

function escapeHtml(str: string) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function logoHtml(store: Store, size: number): string {
  if (!store.logo_url) return '';
  return `<div class="center" style="margin-bottom:6px"><img src="${escapeHtml(store.logo_url)}" alt="${escapeHtml(store.store_name)}" style="width:${size}px;height:${size}px;object-fit:contain;border-radius:8px" /></div>`;
}

const PLATFORM_FOOTER = 'Powered by Maaldhis';

/** Generate thermal receipt HTML (58mm or 80mm) */
export function generateThermalReceiptHTML(data: ReceiptData, width: '58mm' | '80mm' = '80mm'): string {
  const { sale, items, customer, store, cashierName, formatCurrency, paymentMethod } = data;
  const thankYou = store.receipt_thank_you_message || 'Thank you for your purchase!';
  const customFooter = store.receipt_footer_text || '';
  const bodyWidth = width === '58mm' ? '48mm' : '72mm';
  const fontSize = width === '58mm' ? '10px' : '12px';
  const logoSize = width === '58mm' ? 50 : 60;

  const itemRows = items.map(item => `
    <tr>
      <td style="text-align:left;padding:1px 0">${escapeHtml(item.item_name || '')} x${item.quantity}</td>
      <td style="text-align:right;padding:1px 0">${formatCurrency(item.line_total)}</td>
    </tr>
    <tr><td colspan="2" style="font-size:9px;color:#666;padding:0 0 2px 0">@ ${formatCurrency(item.sell_price)} each</td></tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt #${sale.receipt_no}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', 'Lucida Console', monospace;
      width: ${bodyWidth};
      margin: 0 auto;
      padding: 8px;
      font-size: ${fontSize};
      color: #000;
      line-height: 1.4;
    }
    .center { text-align: center; }
    .bold { font-weight: bold; }
    .dashed { border-top: 1px dashed #333; margin: 6px 0; }
    table { width: 100%; border-collapse: collapse; }
    .total-row { font-size: 14px; font-weight: bold; }
    .small { font-size: 9px; color: #555; }
    .footer { margin-top: 12px; text-align: center; font-size: 9px; color: #555; }
    .platform { margin-top: 4px; text-align: center; font-size: 8px; color: #888; font-style: italic; }
    @media print {
      body { width: ${bodyWidth}; padding: 2mm; }
      @page { size: ${width} auto; margin: 0; }
    }
    @media screen {
      body { border: 1px solid #ccc; margin: 20px auto; padding: 16px; background: #fff; }
    }
  </style>
</head>
<body>
  ${logoHtml(store, logoSize)}
  ${(!store.receipt_template || store.receipt_template === 'classic') ? `
  <table style="margin-bottom:4px;">
    <tr>
      <td style="text-align:left; vertical-align:top; width:50%;">
        <div class="bold" style="font-size:14px;margin-bottom:2px">${escapeHtml(store.store_name)}</div>
        ${store.location ? `<div class="small">${escapeHtml(store.location)}</div>` : ''}
        ${store.phone ? `<div class="small">Tel: ${escapeHtml(store.phone)}</div>` : ''}
        <div class="small">Store ID: ${escapeHtml(store.store_code)}</div>
      </td>
      <td style="text-align:right; vertical-align:top; width:50%;">
        <div class="bold" style="font-size:12px;margin-bottom:2px">RECEIPT</div>
        <div class="small">#${escapeHtml(sale.receipt_no)}</div>
        <div class="small">${new Date(sale.sold_at).toLocaleString()}</div>
        <div class="small">Cashier: ${escapeHtml(cashierName)}</div>
      </td>
    </tr>
  </table>
  ` : store.receipt_template === 'modern' ? `
  <div class="center bold" style="font-size:16px;margin-bottom:2px">${escapeHtml(store.store_name)}</div>
  ${store.location ? `<div class="center small">${escapeHtml(store.location)}</div>` : ''}
  ${store.phone ? `<div class="center small">Tel: ${escapeHtml(store.phone)}</div>` : ''}
  <div class="center small">Store ID: ${escapeHtml(store.store_code)}</div>
  <div class="dashed" style="width:30px; margin: 4px auto; border-top: 1px solid #333;"></div>
  <div class="center small">${new Date(sale.sold_at).toLocaleString()}</div>
  <div class="center small">Cashier: ${escapeHtml(cashierName)}</div>
  ` : `
  <div class="bold" style="font-size:14px;margin-bottom:2px">${escapeHtml(store.store_name)}</div>
  <div class="small">${store.location ? escapeHtml(store.location) : ''}${store.location && store.phone ? ' | ' : ''}${store.phone ? `Tel: ${escapeHtml(store.phone)}` : ''}</div>
  <div class="small">Store ID: ${escapeHtml(store.store_code)}</div>
  <div class="small" style="margin-top:4px;">Date: ${new Date(sale.sold_at).toLocaleString()}</div>
  <div class="small">Cashier: ${escapeHtml(cashierName)}</div>
  `}

  ${customer ? `
    <div class="dashed"></div>
    <div class="center small">Customer: ${escapeHtml(customer.name)}</div>
    ${customer.phone ? `<div class="center small">Phone: ${escapeHtml(customer.phone)}</div>` : ''}
  ` : ''}

  <div class="dashed"></div>

  <table>
    <tr class="bold">
      <td style="text-align:left;padding-bottom:2px">Item</td>
      <td style="text-align:right;padding-bottom:2px">Amount</td>
    </tr>
  </table>
  <div class="dashed"></div>
  <table>${itemRows}</table>

  <div class="dashed"></div>

  <table>
    ${sale.discount > 0 || sale.tax > 0 ? `
    <tr>
      <td>Subtotal</td>
      <td style="text-align:right">${formatCurrency(sale.subtotal)}</td>
    </tr>` : ''}
    ${sale.discount > 0 ? `
    <tr>
      <td>Discount</td>
      <td style="text-align:right">-${formatCurrency(sale.discount)}</td>
    </tr>` : ''}
    ${sale.tax > 0 ? `
    <tr>
      <td>Tax ${sale.tax_rate ? `(${sale.tax_rate}%)` : ''}</td>
      <td style="text-align:right">${formatCurrency(sale.tax)}</td>
    </tr>` : ''}
    <tr class="total-row">
      <td>TOTAL</td>
      <td style="text-align:right">${formatCurrency(sale.total)}</td>
    </tr>
    <tr>
      <td>Paid</td>
      <td style="text-align:right">${formatCurrency(sale.paid_amount)}</td>
    </tr>
    ${sale.outstanding_amount > 0 ? `
    <tr>
      <td>Credit Balance</td>
      <td style="text-align:right">${formatCurrency(sale.outstanding_amount)}</td>
    </tr>` : ''}
    ${sale.paid_amount > sale.total && sale.outstanding_amount <= 0 ? `
    <tr>
      <td>Change</td>
      <td style="text-align:right">${formatCurrency(sale.paid_amount - sale.total)}</td>
    </tr>` : ''}
    <tr>
      <td>Payment</td>
      <td style="text-align:right">${(paymentMethod || sale.sale_type).toUpperCase()}</td>
    </tr>
  </table>

  ${sale.status === 'returned' ? `
  <div class="dashed"></div>
  <div class="center bold" style="color:red">*** RETURNED ***</div>
  ` : ''}

  <div class="dashed"></div>
  <div class="footer">${escapeHtml(thankYou)}</div>
  ${customFooter ? `<div class="footer" style="margin-top:2px">${escapeHtml(customFooter)}</div>` : ''}
  <div class="platform">${escapeHtml(PLATFORM_FOOTER)}</div>
</body>
</html>`;
}

/** Generate A4 invoice HTML */
export function generateA4InvoiceHTML(data: ReceiptData): string {
  const { sale, items, customer, store, cashierName, formatCurrency, paymentMethod } = data;
  const thankYou = store.receipt_thank_you_message || 'Thank you for your purchase!';
  const customFooter = store.receipt_footer_text || '';

  const itemRows = items.map((item, i) => `
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${i + 1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${escapeHtml(item.item_name || '')}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(item.sell_price)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${formatCurrency(item.line_total)}</td>
    </tr>
  `).join('');

  const logoSection = store.logo_url
    ? `<img src="${escapeHtml(store.logo_url)}" alt="${escapeHtml(store.store_name)}" style="width:80px;height:80px;object-fit:contain;border-radius:8px;margin-bottom:8px" />`
    : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${sale.receipt_no}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #333; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.5; }
    table { width: 100%; border-collapse: collapse; }
    @media print { body { padding: 20px; } @page { size: A4; margin: 15mm; } }
    @media screen { body { border: 1px solid #ddd; margin: 20px auto; background: #fff; } }
  </style>
</head>
<body>
  <!-- Header -->
  <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:30px">
    <div>
      ${logoSection}
      <h1 style="font-size:24px;color:#2d7d46;margin-bottom:4px">${escapeHtml(store.store_name)}</h1>
      ${store.location ? `<div style="font-size:13px;color:#666">${escapeHtml(store.location)}</div>` : ''}
      ${store.phone ? `<div style="font-size:13px;color:#666">Tel: ${escapeHtml(store.phone)}</div>` : ''}
      <div style="font-size:12px;color:#999">Store ID: ${escapeHtml(store.store_code)}</div>
    </div>
    <div style="text-align:right">
      <h2 style="font-size:20px;color:#333;margin-bottom:4px">INVOICE</h2>
      <div style="font-size:13px;color:#666">#${escapeHtml(sale.receipt_no)}</div>
      <div style="font-size:13px;color:#666">${new Date(sale.sold_at).toLocaleDateString()}</div>
      <div style="font-size:13px;color:#666">${new Date(sale.sold_at).toLocaleTimeString()}</div>
    </div>
  </div>

  <!-- Customer / Cashier -->
  <div style="display:flex;justify-content:space-between;margin-bottom:24px;padding:12px 16px;background:#f8f9fa;border-radius:8px">
    <div>
      <div style="font-size:11px;color:#999;text-transform:;font-weight:600;margin-bottom:4px">Bill To</div>
      ${customer ? `
        <div style="font-weight:600">${escapeHtml(customer.name)}</div>
        ${customer.phone ? `<div style="font-size:13px;color:#666">${escapeHtml(customer.phone)}</div>` : ''}
        ${customer.address ? `<div style="font-size:13px;color:#666">${escapeHtml(customer.address)}</div>` : ''}
      ` : `<div style="color:#999">Walk-in Customer</div>`}
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#999;text-transform:;font-weight:600;margin-bottom:4px">Served By</div>
      <div>${escapeHtml(cashierName)}</div>
      <div style="font-size:13px;color:#666">Payment: ${(paymentMethod || sale.sale_type).toUpperCase()}</div>
    </div>
  </div>

  ${sale.status === 'returned' ? `
  <div style="background:#fee;border:1px solid #fcc;border-radius:8px;padding:8px 16px;margin-bottom:16px;text-align:center;font-weight:bold;color:#c00">
    RETURNED / REFUNDED
  </div>` : ''}

  <!-- Items -->
  <table style="margin-bottom:24px">
    <thead>
      <tr style="background:#f0f0f0">
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;text-transform:">#</th>
        <th style="padding:10px 12px;text-align:left;font-size:12px;color:#666;text-transform:">Item</th>
        <th style="padding:10px 12px;text-align:center;font-size:12px;color:#666;text-transform:">Qty</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;text-transform:">Unit Price</th>
        <th style="padding:10px 12px;text-align:right;font-size:12px;color:#666;text-transform:">Total</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end">
    <table style="width:280px">
      ${sale.discount > 0 || sale.tax > 0 ? `
      <tr>
        <td style="padding:4px 0;color:#666">Subtotal</td>
        <td style="padding:4px 0;text-align:right">${formatCurrency(sale.subtotal)}</td>
      </tr>` : ''}
      ${sale.discount > 0 ? `
      <tr>
        <td style="padding:4px 0;color:#666">Discount</td>
        <td style="padding:4px 0;text-align:right;color:#c00">-${formatCurrency(sale.discount)}</td>
      </tr>` : ''}
      ${sale.tax > 0 ? `
      <tr>
        <td style="padding:4px 0;color:#666">Tax ${sale.tax_rate ? `(${sale.tax_rate}%)` : ''}</td>
        <td style="padding:4px 0;text-align:right">${formatCurrency(sale.tax)}</td>
      </tr>` : ''}
      <tr style="border-top:2px solid #333">
        <td style="padding:8px 0;font-weight:bold;font-size:16px">TOTAL</td>
        <td style="padding:8px 0;text-align:right;font-weight:bold;font-size:16px;color:#2d7d46">${formatCurrency(sale.total)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#666">Amount Paid</td>
        <td style="padding:4px 0;text-align:right">${formatCurrency(sale.paid_amount)}</td>
      </tr>
      ${sale.outstanding_amount > 0 ? `
      <tr>
        <td style="padding:4px 0;color:#c00;font-weight:600">Credit Balance</td>
        <td style="padding:4px 0;text-align:right;color:#c00;font-weight:600">${formatCurrency(sale.outstanding_amount)}</td>
      </tr>` : ''}
      ${sale.paid_amount > sale.total && sale.outstanding_amount <= 0 ? `
      <tr>
        <td style="padding:4px 0;color:#666">Change</td>
        <td style="padding:4px 0;text-align:right">${formatCurrency(sale.paid_amount - sale.total)}</td>
      </tr>` : ''}
    </table>
  </div>

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #eee;text-align:center">
    <div style="font-size:13px;color:#666">${escapeHtml(thankYou)}</div>
    ${customFooter ? `<div style="font-size:12px;color:#888;margin-top:2px">${escapeHtml(customFooter)}</div>` : ''}
    <div style="font-size:11px;color:#aaa;margin-top:6px;font-style:italic">${escapeHtml(PLATFORM_FOOTER)}</div>
  </div>
</body>
</html>`;
}

export type ReceiptFormat = '58mm' | '80mm' | 'a4';

/** Print receipt in a new window */
export function printReceipt(data: ReceiptData, format: ReceiptFormat = '80mm') {
  const html = format === 'a4'
    ? generateA4InvoiceHTML(data)
    : generateThermalReceiptHTML(data, format);

  const printWindow = window.open('', '_blank', format === 'a4' ? 'width=850,height=1100' : 'width=400,height=700');
  if (!printWindow) return;

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
    printWindow.print();
  }, 400);
}

/** Download receipt as PDF (uses browser print-to-PDF) */
export function downloadReceiptPDF(data: ReceiptData, format: ReceiptFormat = 'a4') {
  printReceipt(data, format);
}

/** Generate shareable text */
export function generateReceiptText(data: ReceiptData): string {
  const { sale, items, customer, store, cashierName, formatCurrency } = data;
  return [
    `📄 Receipt #${sale.receipt_no}`,
    `🏪 ${store.store_name}`,
    store.location ? `📍 ${store.location}` : '',
    store.phone ? `📞 ${store.phone}` : '',
    `📅 ${new Date(sale.sold_at).toLocaleString()}`,
    `👤 Cashier: ${cashierName}`,
    customer ? `🙋 Customer: ${customer.name}${customer.phone ? ` (${customer.phone})` : ''}` : '',
    '',
    '─────────────────────',
    ...items.map(i => `${i.item_name} x${i.quantity} @ ${formatCurrency(i.sell_price)}  ${formatCurrency(i.line_total)}`),
    '─────────────────────',
    sale.discount > 0 || sale.tax > 0 ? `Subtotal: ${formatCurrency(sale.subtotal)}` : '',
    sale.discount > 0 ? `Discount: -${formatCurrency(sale.discount)}` : '',
    sale.tax > 0 ? `Tax ${sale.tax_rate ? `(${sale.tax_rate}%)` : ''}: ${formatCurrency(sale.tax)}` : '',
    `💰 TOTAL: ${formatCurrency(sale.total)}`,
    `✅ Paid: ${formatCurrency(sale.paid_amount)}`,
    sale.outstanding_amount > 0 ? `⚠️ Credit Balance: ${formatCurrency(sale.outstanding_amount)}` : '',
    sale.paid_amount > sale.total && sale.outstanding_amount <= 0 ? `💵 Change: ${formatCurrency(sale.paid_amount - sale.total)}` : '',
    `Payment: ${sale.sale_type.toUpperCase()}`,
    '',
    store.receipt_thank_you_message || 'Thank you for your purchase! 🙏',
    '',
    `— Powered by Maaldhis`,
  ].filter(Boolean).join('\n');
}

/** Share receipt via Web Share API or clipboard */
export async function shareReceipt(data: ReceiptData) {
  const text = generateReceiptText(data);
  if (navigator.share) {
    try {
      await navigator.share({ title: `Receipt #${data.sale.receipt_no}`, text });
    } catch {}
  } else {
    await navigator.clipboard.writeText(text);
    return 'copied';
  }
  return 'shared';
}
