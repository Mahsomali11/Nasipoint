

async function run() {
    const token = '27|DnxG6ySzmQeNvhvp9UFUKNbB7ZdfMWJC9VYYK9VQ85408c97';
    const storeId = '01a09566-448c-7075-bd19-ef317d35572e';
    const opts = {
        headers: { 'Authorization': `Bearer ${token}` }
    };

    const endpoints = [
        `/api/rest/v1/items?store_id=eq.${storeId}`,
        `/api/rest/v1/customers?store_id=eq.${storeId}`,
        `/api/rest/v1/suppliers?store_id=eq.${storeId}`,
        `/api/rest/v1/expenses?store_id=eq.${storeId}&order=created_at.desc`,
        `/api/rest/v1/sales?store_id=eq.${storeId}&order=sold_at.desc`,
        `/api/rest/v1/sale_items`,
        `/api/rest/v1/customer_debts?store_id=eq.${storeId}`,
        `/api/rest/v1/payments?store_id=eq.${storeId}&order=created_at.desc`,
        `/api/rest/v1/returns?store_id=eq.${storeId}`,
        `/api/rest/v1/staff_accounts?store_id=eq.${storeId}`,
        `/api/rest/v1/stock_transfers?or=source_store_id.eq.${storeId},destination_store_id.eq.${storeId}&order=created_at.desc`,
    ];

    for (const ep of endpoints) {
        console.log(`=== ${ep} ===`);
        try {
            const res = await fetch(`http://127.0.0.1:8000${ep}`, opts);
            console.log(`Status: ${res.status}`);
            const text = await res.text();
            console.log(text.substring(0, 150) + (text.length > 150 ? '...' : ''));
        } catch (e) {
            console.error(e.message);
        }
        console.log('');
    }
}
run();
