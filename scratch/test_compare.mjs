
async function run() {
    const token = '27|DnxG6ySzmQeNvhvp9UFUKNbB7ZdfMWJC9VYYK9VQ85408c97';
    const storeId = '01a09566-448c-7075-bd19-ef317d35572e';
    const headers = { 
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    console.log(`=== Testing GET items ===`);
    const resGet = await fetch(`http://127.0.0.1:8000/api/rest/v1/items?store_id=eq.${storeId}`, { headers });
    const dataGet = await resGet.json();
    console.log(JSON.stringify(dataGet[0]));

    console.log(`=== Testing RPC get_store_data ===`);
    const resRpc = await fetch(`http://127.0.0.1:8000/api/rest/v1/rpc/get_store_data`, { 
        method: 'POST', 
        headers, 
        body: JSON.stringify({ _store_id: storeId }) 
    });
    const dataRpc = await resRpc.json();
    console.log(JSON.stringify(dataRpc.items[0]));
}
run();
