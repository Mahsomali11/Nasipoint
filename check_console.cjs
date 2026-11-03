const puppeteer = require('puppeteer-core');

(async () => {
    try {
        const browser = await puppeteer.launch({
            executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
            headless: true
        });
        const page = await browser.newPage();
        
        page.on('console', msg => console.log('PAGE LOG:', msg.text()));
        page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
        
        console.log('Navigating...');
        await page.goto('http://127.0.0.1:8000/login', { waitUntil: 'networkidle0', timeout: 15000 });
        console.log('Done waiting.');
        
        await browser.close();
    } catch(e) {
        console.error(e);
    }
})();
