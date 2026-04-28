const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'kettan.client', 'src');

const replacements = [
  path.join(basePath, 'features', 'staff', 'StaffPage.tsx'),
  path.join(basePath, 'features', 'settings', 'SettingsPage.tsx'),
  path.join(basePath, 'features', 'menu', 'MenuItemProfilePage.tsx'),
  path.join(basePath, 'features', 'menu', 'AddMenuItemPage.tsx'),
  path.join(basePath, 'features', 'company', 'CompanyProfilePage.tsx'),
  path.join(basePath, 'features', 'branches', 'AddBranchPage.tsx')
];

let successCount = 0;
let failureCount = 0;

replacements.forEach((file, index) => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    
    // Replace `if (uploadRes.ok)` with `if (uploadRes.status >= 200)`
    let updated = content.replace(/if \(\s*(\w+)\.ok\s*\)\s*\{/g, 'if ($1.status >= 200 && $1.status < 300) {');
    
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`✅ [${index + 1}] Replaced .ok in ${file}`);
    successCount++;
  } catch (error) {
    console.error(`❌ [${index + 1}] ERROR: ${error.message} on ${file}`);
    failureCount++;
  }
});

console.log(`Success: \${successCount}, Failures: \${failureCount}`);
