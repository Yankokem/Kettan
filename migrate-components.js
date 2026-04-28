const fs = require('fs');
const path = require('path');

const filesToMigrate = [
    'kettan.client/src/features/analytics/AnalyticsPage.tsx',
    'kettan.client/src/features/dashboard/components/SuperAdminDashboard.tsx',
    'kettan.client/src/features/audit-logs/AuditLogsPage.tsx',
    'kettan.client/src/features/branches/AddBranchPage.tsx',
    'kettan.client/src/features/company/CompanyProfilePage.tsx',
    'kettan.client/src/features/menu/AddMenuItemPage.tsx',
    'kettan.client/src/features/menu/MenuItemProfilePage.tsx',
    'kettan.client/src/features/settings/SettingsPage.tsx',
    'kettan.client/src/features/staff/StaffPage.tsx'
];

function determineImportDepth(filePath) {
    const slashes = filePath.split('/').length;
    // 'kettan.client/src/features/staff/StaffPage.tsx' has 5 slashes
    const depth = slashes - 3; 
    let rel = '';
    for(let i=0; i<depth; i++) rel += '../';
    return rel + 'utils/api';
}

for (const file of filesToMigrate) {
    const fullPath = path.join(__dirname, file);
    if (!fs.existsSync(fullPath)) continue;
    let content = fs.readFileSync(fullPath, 'utf8');
    let changed = false;

    // 1) Ensure API import
    const apiImportPath = determineImportDepth(file);
    if (!content.includes(`} from '${apiImportPath}'`) && !content.includes(`} from "${apiImportPath}"`)) {
        if (content.includes("from 'react'")) {
             // Add after react import
             content = content.replace(/(import .* from 'react';?)/, `$1\nimport { api } from '${apiImportPath}';`);
        } else {
            content = `import { api } from '${apiImportPath}';\n` + content;
        }
        changed = true;
    }

    // 2) Replace fetch('/api/uploads/image', { method: 'POST', body: formData }) with api.post('/api/uploads/image', formData)
    const uploadFetchRegex = /const (\w+) = await fetch\(['`]\/api\/uploads\/image['`],\s*\{\s*method:\s*['"]POST['"],\s*body:\s*(\w+),\s*\}\);/g;
    if (uploadFetchRegex.test(content)) {
        content = content.replace(uploadFetchRegex, `const $1 = await api.post('/api/uploads/image', $2);`);
        changed = true;
    }

    // Also look for "if (!uploadRes.ok)"
    const uploadOkRegex = /if \(!(\w+)\.ok\) throw new Error\('([^']+)'\);/g;
    if (uploadOkRegex.test(content)) {
        // We'll trust the try-catch block for axios, but if there's a manual throw we might just remove it
        // Actually, just changing `uploadRes.json()` to `uploadRes.data` is needed.
        content = content.replace(uploadOkRegex, ``); // Axios throws on !ok automatically
        changed = true;
    }
    const uploadJsonRegex = /const (\w+) = await (\w+)\.json\(\);/g;
    if (uploadJsonRegex.test(content)) {
         content = content.replace(uploadJsonRegex, `const $1 = $2.data;`);
         changed = true;
    }

    // 3) AuditLogsPage fetch
    const auditFetchRegex = /const (\w+) = await fetch\(`\/api\/audit-logs\?\$\{params\}`,\s*\{\s*credentials:\s*'include'\s*\}\);/g;
    if (auditFetchRegex.test(content)) {
         content = content.replace(auditFetchRegex, `const $1 = await api.get(\`/api/audit-logs?\${params}\`);`);
         changed = true;
    }

    // 4) AnalyticsPage & DashboardPage
    const analyticsDashboardRegex = /const (\w+) = await fetch\('([^']+)',\s*\{\s*credentials:\s*'include'\s*\}\s*\);\s*if\s*\(!\1\.ok\)\s*throw new Error\([^)]+\);\s*return \1\.json\(\);/g;
    if (analyticsDashboardRegex.test(content)) {
        content = content.replace(analyticsDashboardRegex, `const $1 = await api.get('$2');\n  return $1.data;`);
        changed = true;
    }

    // 5) AddBranchPage fetching users
    const usersFetchRegex = /fetch\('\/api\/users'\)\s*\.then\(\(res\) => res\.json\(\)\)/g;
    if(usersFetchRegex.test(content)) {
        content = content.replace(usersFetchRegex, `api.get('/api/users').then((res) => res.data)`);
        changed = true;
    }

    // 6) SettingsPage auth profile
    const profileFetchRegex = /const (\w+) = await fetch\('\/api\/auth\/profile',\s*\{\s*headers:[^}]+\}\s*\);/g;
    if (profileFetchRegex.test(content)) {
        content = content.replace(profileFetchRegex, `const $1 = await api.get('/api/auth/profile');`);
        changed = true;
    }

    if (changed) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
    }
}
