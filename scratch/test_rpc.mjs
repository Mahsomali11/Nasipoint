
async function run() {
    const token = '27|DnxG6ySzmQeNvhvp9UFUKNbB7ZdfMWJC9VYYK9VQ85408c97';
    const storeId = '01a09566-448c-7075-bd19-ef317d35572e';
    const opts = {
        method: 'POST',
        headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ _store_id: storeId })
    };

    console.log(`=== Testing RPC get_store_data ===`);
    const t0 = Date.now();
    try {
        const res = await fetch(`http://127.0.0.1:8000/api/rest/v1/rpc/get_store_data`, opts);
        const t1 = Date.now();
        console.log(`Status: ${res.status}`);
        console.log(`Time: ${t1 - t0}ms`);
        const data = await res.json();
        console.log(Object.keys(data).map(k => `${k}: ${data[k]?.length} records`).join('\n'));
    } catch (e) {
        console.error(e.message);
    }
}
run();
