const fs = require('fs');
const path = require('path');

function migrateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    // Check if react-router-dom is imported
    if (content.includes('react-router-dom')) {
        // Replace imports
        content = content.replace(/import\s+\{.*\}\s+from\s+['"]react-router-dom['"];?/g, "import { router, usePage, Link } from '@inertiajs/react';");
        
        // Replace useNavigate()
        content = content.replace(/const\s+navigate\s*=\s*useNavigate\(\);/g, "const navigate = (url, options) => router.visit(url, options);");
        
        // Replace useLocation()
        content = content.replace(/const\s+location\s*=\s*useLocation\(\);/g, "const { url } = usePage(); const location = { pathname: url };");
        
        // Replace NavLink as RouterNavLink with Link (or just plain Link if we can)
        content = content.replace(/<RouterNavLink/g, "<Link");
        content = content.replace(/<\/RouterNavLink>/g, "</Link>");
        
        fs.writeFileSync(filePath, content);
        console.log(`Migrated react-router-dom in ${filePath}`);
        modified = true;
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walkDir(filePath);
        } else if (filePath.endsWith('.tsx') && !filePath.endsWith('App.tsx')) {
            migrateFile(filePath);
        }
    }
}

walkDir(path.join(__dirname, 'resources/js'));
