function e(l){return l.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")}function u(l,t){return l.logo_url?`<div class="center" style="margin-bottom:6px"><img src="${e(l.logo_url)}" alt="${e(l.store_name)}" style="width:${t}px;height:${t}px;object-fit:contain;border-radius:8px" /></div>`:""}const y="Powered by Nasri Account System";function v(l,t="80mm"){const{sale:o,items:n,customer:a,store:i,cashierName:d,formatCurrency:s,paymentMethod:m}=l,p=i.receipt_thank_you_message||"Thank you for your purchase!",c=i.receipt_footer_text||"",x=t==="58mm"?"48mm":"72mm",r=t==="58mm"?"10px":"12px",h=t==="58mm"?50:60,$=n.map(g=>`
    <tr>
      <td style="text-align:left;padding:1px 0">${e(g.item_name||"")} x${g.quantity}</td>
      <td style="text-align:right;padding:1px 0">${s(g.line_total)}</td>
    </tr>
    <tr><td colspan="2" style="font-size:9px;color:#666;padding:0 0 2px 0">@ ${s(g.sell_price)} each</td></tr>
  `).join("");return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Receipt #${o.receipt_no}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', 'Lucida Console', monospace;
      width: ${x};
      margin: 0 auto;
      padding: 8px;
      font-size: ${r};
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
      body { width: ${x}; padding: 2mm; }
      @page { size: ${t} auto; margin: 0; }
    }
    @media screen {
      body { border: 1px solid #ccc; margin: 20px auto; padding: 16px; background: #fff; }
    }
  </style>
</head>
<body>
  ${u(i,h)}
  ${!i.receipt_template||i.receipt_template==="classic"?`
  <table style="margin-bottom:4px;">
    <tr>
      <td style="text-align:left; vertical-align:top; width:50%;">
        <div class="bold" style="font-size:14px;margin-bottom:2px">${e(i.store_name)}</div>
        ${i.location?`<div class="small">${e(i.location)}</div>`:""}
        ${i.phone?`<div class="small">Tel: ${e(i.phone)}</div>`:""}
        <div class="small">Store ID: ${e(i.store_code)}</div>
      </td>
      <td style="text-align:right; vertical-align:top; width:50%;">
        <div class="bold" style="font-size:12px;margin-bottom:2px">RECEIPT</div>
        <div class="small">#${e(o.receipt_no)}</div>
        <div class="small">${new Date(o.sold_at).toLocaleString()}</div>
        <div class="small">Cashier: ${e(d)}</div>
      </td>
    </tr>
  </table>
  `:i.receipt_template==="modern"?`
  <div class="center bold" style="font-size:16px;margin-bottom:2px">${e(i.store_name)}</div>
  ${i.location?`<div class="center small">${e(i.location)}</div>`:""}
  ${i.phone?`<div class="center small">Tel: ${e(i.phone)}</div>`:""}
  <div class="center small">Store ID: ${e(i.store_code)}</div>
  <div class="dashed" style="width:30px; margin: 4px auto; border-top: 1px solid #333;"></div>
  <div class="center small">${new Date(o.sold_at).toLocaleString()}</div>
  <div class="center small">Cashier: ${e(d)}</div>
  `:`
  <div class="bold" style="font-size:14px;margin-bottom:2px">${e(i.store_name)}</div>
  <div class="small">${i.location?e(i.location):""}${i.location&&i.phone?" | ":""}${i.phone?`Tel: ${e(i.phone)}`:""}</div>
  <div class="small">Store ID: ${e(i.store_code)}</div>
  <div class="small" style="margin-top:4px;">Date: ${new Date(o.sold_at).toLocaleString()}</div>
  <div class="small">Cashier: ${e(d)}</div>
  `}

  ${a?`
    <div class="dashed"></div>
    <div class="center small">Customer: ${e(a.name)}</div>
    ${a.phone?`<div class="center small">Phone: ${e(a.phone)}</div>`:""}
  `:""}

  <div class="dashed"></div>

  <table>
    <tr class="bold">
      <td style="text-align:left;padding-bottom:2px">Item</td>
      <td style="text-align:right;padding-bottom:2px">Amount</td>
    </tr>
  </table>
  <div class="dashed"></div>
  <table>${$}</table>

  <div class="dashed"></div>

  <table>
    ${o.discount>0||o.tax>0?`
    <tr>
      <td>Subtotal</td>
      <td style="text-align:right">${s(o.subtotal)}</td>
    </tr>`:""}
    ${o.discount>0?`
    <tr>
      <td>Discount</td>
      <td style="text-align:right">-${s(o.discount)}</td>
    </tr>`:""}
    ${o.tax>0?`
    <tr>
      <td>Tax ${o.tax_rate?`(${o.tax_rate}%)`:""}</td>
      <td style="text-align:right">${s(o.tax)}</td>
    </tr>`:""}
    <tr class="total-row">
      <td>TOTAL</td>
      <td style="text-align:right">${s(o.total)}</td>
    </tr>
    <tr>
      <td>Paid</td>
      <td style="text-align:right">${s(o.paid_amount)}</td>
    </tr>
    ${o.outstanding_amount>0?`
    <tr>
      <td>Credit Balance</td>
      <td style="text-align:right">${s(o.outstanding_amount)}</td>
    </tr>`:""}
    ${o.paid_amount>o.total&&o.outstanding_amount<=0?`
    <tr>
      <td>Change</td>
      <td style="text-align:right">${s(o.paid_amount-o.total)}</td>
    </tr>`:""}
    <tr>
      <td>Payment</td>
      <td style="text-align:right">${(m||o.sale_type).toUpperCase()}</td>
    </tr>
  </table>

  ${o.status==="returned"?`
  <div class="dashed"></div>
  <div class="center bold" style="color:red">*** RETURNED ***</div>
  `:""}

  <div class="dashed"></div>
  <div class="footer">${e(p)}</div>
  ${c?`<div class="footer" style="margin-top:2px">${e(c)}</div>`:""}
  <div class="platform">${e(y)}</div>
</body>
</html>`}function f(l){const{sale:t,items:o,customer:n,store:a,cashierName:i,formatCurrency:d,paymentMethod:s}=l,m=a.receipt_thank_you_message||"Thank you for your purchase!",p=a.receipt_footer_text||"",c=o.map((r,h)=>`
    <tr>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${h+1}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee">${e(r.item_name||"")}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:center">${r.quantity}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${d(r.sell_price)}</td>
      <td style="padding:8px 12px;border-bottom:1px solid #eee;text-align:right">${d(r.line_total)}</td>
    </tr>
  `).join(""),x=a.logo_url?`<img src="${e(a.logo_url)}" alt="${e(a.store_name)}" style="width:80px;height:80px;object-fit:contain;border-radius:8px;margin-bottom:8px" />`:"";return`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Invoice #${t.receipt_no}</title>
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
      ${x}
      <h1 style="font-size:24px;color:#2d7d46;margin-bottom:4px">${e(a.store_name)}</h1>
      ${a.location?`<div style="font-size:13px;color:#666">${e(a.location)}</div>`:""}
      ${a.phone?`<div style="font-size:13px;color:#666">Tel: ${e(a.phone)}</div>`:""}
      <div style="font-size:12px;color:#999">Store ID: ${e(a.store_code)}</div>
    </div>
    <div style="text-align:right">
      <h2 style="font-size:20px;color:#333;margin-bottom:4px">INVOICE</h2>
      <div style="font-size:13px;color:#666">#${e(t.receipt_no)}</div>
      <div style="font-size:13px;color:#666">${new Date(t.sold_at).toLocaleDateString()}</div>
      <div style="font-size:13px;color:#666">${new Date(t.sold_at).toLocaleTimeString()}</div>
    </div>
  </div>

  <!-- Customer / Cashier -->
  <div style="display:flex;justify-content:space-between;margin-bottom:24px;padding:12px 16px;background:#f8f9fa;border-radius:8px">
    <div>
      <div style="font-size:11px;color:#999;text-transform:;font-weight:600;margin-bottom:4px">Bill To</div>
      ${n?`
        <div style="font-weight:600">${e(n.name)}</div>
        ${n.phone?`<div style="font-size:13px;color:#666">${e(n.phone)}</div>`:""}
        ${n.address?`<div style="font-size:13px;color:#666">${e(n.address)}</div>`:""}
      `:'<div style="color:#999">Walk-in Customer</div>'}
    </div>
    <div style="text-align:right">
      <div style="font-size:11px;color:#999;text-transform:;font-weight:600;margin-bottom:4px">Served By</div>
      <div>${e(i)}</div>
      <div style="font-size:13px;color:#666">Payment: ${(s||t.sale_type).toUpperCase()}</div>
    </div>
  </div>

  ${t.status==="returned"?`
  <div style="background:#fee;border:1px solid #fcc;border-radius:8px;padding:8px 16px;margin-bottom:16px;text-align:center;font-weight:bold;color:#c00">
    RETURNED / REFUNDED
  </div>`:""}

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
    <tbody>${c}</tbody>
  </table>

  <!-- Totals -->
  <div style="display:flex;justify-content:flex-end">
    <table style="width:280px">
      ${t.discount>0||t.tax>0?`
      <tr>
        <td style="padding:4px 0;color:#666">Subtotal</td>
        <td style="padding:4px 0;text-align:right">${d(t.subtotal)}</td>
      </tr>`:""}
      ${t.discount>0?`
      <tr>
        <td style="padding:4px 0;color:#666">Discount</td>
        <td style="padding:4px 0;text-align:right;color:#c00">-${d(t.discount)}</td>
      </tr>`:""}
      ${t.tax>0?`
      <tr>
        <td style="padding:4px 0;color:#666">Tax ${t.tax_rate?`(${t.tax_rate}%)`:""}</td>
        <td style="padding:4px 0;text-align:right">${d(t.tax)}</td>
      </tr>`:""}
      <tr style="border-top:2px solid #333">
        <td style="padding:8px 0;font-weight:bold;font-size:16px">TOTAL</td>
        <td style="padding:8px 0;text-align:right;font-weight:bold;font-size:16px;color:#2d7d46">${d(t.total)}</td>
      </tr>
      <tr>
        <td style="padding:4px 0;color:#666">Amount Paid</td>
        <td style="padding:4px 0;text-align:right">${d(t.paid_amount)}</td>
      </tr>
      ${t.outstanding_amount>0?`
      <tr>
        <td style="padding:4px 0;color:#c00;font-weight:600">Credit Balance</td>
        <td style="padding:4px 0;text-align:right;color:#c00;font-weight:600">${d(t.outstanding_amount)}</td>
      </tr>`:""}
      ${t.paid_amount>t.total&&t.outstanding_amount<=0?`
      <tr>
        <td style="padding:4px 0;color:#666">Change</td>
        <td style="padding:4px 0;text-align:right">${d(t.paid_amount-t.total)}</td>
      </tr>`:""}
    </table>
  </div>

  <!-- Footer -->
  <div style="margin-top:40px;padding-top:16px;border-top:1px solid #eee;text-align:center">
    <div style="font-size:13px;color:#666">${e(m)}</div>
    ${p?`<div style="font-size:12px;color:#888;margin-top:2px">${e(p)}</div>`:""}
    <div style="font-size:11px;color:#aaa;margin-top:6px;font-style:italic">${e(y)}</div>
  </div>
</body>
</html>`}function _(l,t="80mm"){const o=t==="a4"?f(l):v(l,t),n=window.open("","_blank",t==="a4"?"width=850,height=1100":"width=400,height=700");n&&(n.document.write(o),n.document.close(),n.focus(),setTimeout(()=>{n.print()},400))}function b(l){const{sale:t,items:o,customer:n,store:a,cashierName:i,formatCurrency:d}=l;return[`📄 Receipt #${t.receipt_no}`,`🏪 ${a.store_name}`,a.location?`📍 ${a.location}`:"",a.phone?`📞 ${a.phone}`:"",`📅 ${new Date(t.sold_at).toLocaleString()}`,`👤 Cashier: ${i}`,n?`🙋 Customer: ${n.name}${n.phone?` (${n.phone})`:""}`:"","","─────────────────────",...o.map(s=>`${s.item_name} x${s.quantity} @ ${d(s.sell_price)}  ${d(s.line_total)}`),"─────────────────────",t.discount>0||t.tax>0?`Subtotal: ${d(t.subtotal)}`:"",t.discount>0?`Discount: -${d(t.discount)}`:"",t.tax>0?`Tax ${t.tax_rate?`(${t.tax_rate}%)`:""}: ${d(t.tax)}`:"",`💰 TOTAL: ${d(t.total)}`,`✅ Paid: ${d(t.paid_amount)}`,t.outstanding_amount>0?`⚠️ Credit Balance: ${d(t.outstanding_amount)}`:"",t.paid_amount>t.total&&t.outstanding_amount<=0?`💵 Change: ${d(t.paid_amount-t.total)}`:"",`Payment: ${t.sale_type.toUpperCase()}`,"",a.receipt_thank_you_message||"Thank you for your purchase! 🙏","","— Powered by Nasri Account System"].filter(Boolean).join(`
`)}async function w(l){const t=b(l);if(navigator.share)try{await navigator.share({title:`Receipt #${l.sale.receipt_no}`,text:t})}catch{}else return await navigator.clipboard.writeText(t),"copied";return"shared"}export{_ as p,w as s};
