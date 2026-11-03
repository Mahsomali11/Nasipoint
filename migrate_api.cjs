const fs = require('fs');
const path = require('path');

function migrateFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let modified = false;
    
    if (content.includes("api as supabase")) {
        content = content.replace(/import \{ api as supabase \} from ['"]@\/api['"];/g, "import { api as apiClient } from '@/api';");
        
        // Replace all supabase. occurrences
        content = content.replace(/\bsupabase\./g, "apiClient.");
        
        // Replace any remaining supabase identifiers
        content = content.replace(/\bsupabase\b/g, "apiClient");
        
        fs.writeFileSync(filePath, content);
        console.log(`Migrated API naming in ${filePath}`);
        modified = true;
    }
}

function walkDir(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const filePath = path.join(dir, file);
        if (fs.statSync(filePath).isDirectory()) {
            walkDir(filePath);
        } else if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
            migrateFile(filePath);
        }
    }
}

walkDir(path.join(__dirname, 'resources/js'));
