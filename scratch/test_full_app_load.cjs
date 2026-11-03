const http = require('http');

async function testApi() {
    // 1. Get token
    const tokenOptions = {
        hostname: 'localhost',
        port: 8000,
        path: '/api/auth/v1/token',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    };

    const tokenReq = http.request(tokenOptions, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            const token = JSON.parse(data).token;
            console.log("Got token:", token.substring(0, 20) + "...");
            
            // 2. Fetch stores
            fetchEndpoint(token, '/api/rest/v1/stores?owner_user_id=eq.01a09566-446d-729b-bd2b-96474b4f37f1', 'Stores');
            // 3. Fetch profiles
            fetchEndpoint(token, '/api/rest/v1/profiles?id=eq.01a09566-446d-729b-bd2b-96474b4f37f1', 'Profile');
            
            // 4. Fetch store data
            const storeId = '01a09566-448c-7075-bd19-ef317d35572e';
            const endpoints = [
                `/api/rest/v1/items?store_id=eq.${storeId}`,
                `/api/rest/v1/customers?store_id=eq.${storeId}`,
                `/api/rest/v1/sales?store_id=eq.${storeId}`,
                `/api/rest/v1/returns?store_id=eq.${storeId}`,
                `/api/rest/v1/sale_items`,
            ];
            
            endpoints.forEach(ep => fetchEndpoint(token, ep, ep.split('?')[0]));
        });
    });

    tokenReq.write(JSON.stringify({
        email: 'mahamedsomali15@gmail.com',
        password: 'password123'
    }));
    tokenReq.end();
}

function fetchEndpoint(token, path, label) {
    const options = {
        hostname: 'localhost',
        port: 8000,
        path: path,
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
        }
    };
    const req = http.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            console.log(`[${res.statusCode}] ${label}:`, data.substring(0, 100) + (data.length > 100 ? '...' : ''));
        });
    });
    req.end();
}

testApi();
