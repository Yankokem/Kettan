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
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace `await api.post('/api/uploads/image', variable);` 
    // with `await api.post('/api/uploads/image', variable, { headers: { 'Content-Type': 'multipart/form-data' } });`
    content = content.replace(
      /await api\.post\('\/api\/uploads\/image',\s*(\w+)\);/g,
      `await api.post('/api/uploads/image', $1, { headers: { 'Content-Type': 'multipart/form-data' } });`
    );

    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ [${index + 1}] Added multipart/form-data headers to ${file}`);
    successCount++;
  } catch (error) {
    console.error(`❌ [${index + 1}] ERROR: ${error.message} on ${file}`);
    failureCount++;
  }
});

console.log(`Success: \${successCount}, Failures: \${failureCount}`);
