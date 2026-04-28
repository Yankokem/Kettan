const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'kettan.client', 'src');

const replacements = [
  {
    file: path.join(basePath, 'features', 'staff', 'StaffPage.tsx'),
    oldRegex: /const (\w+) = await fetch\('\/api\/uploads\/image',\s*\{\s*method:\s*'POST',\s*credentials:\s*'include',\s*body:\s*(\w+),\s*\}\);/m,
    newReplacement: `const $1 = await api.post('/api/uploads/image', $2);`
  },
  {
    file: path.join(basePath, 'features', 'settings', 'SettingsPage.tsx'),
    oldRegex: /const (\w+) = await fetch\('\/api\/uploads\/image',\s*\{\s*method:\s*'POST',\s*credentials:\s*'include',\s*body:\s*(\w+),\s*\}\);/m,
    newReplacement: `const $1 = await api.post('/api/uploads/image', $2);`
  },
  {
    file: path.join(basePath, 'features', 'menu', 'MenuItemProfilePage.tsx'),
    oldRegex: /const (\w+) = await fetch\('\/api\/uploads\/image',\s*\{\s*method:\s*'POST',\s*credentials:\s*'include',\s*body:\s*(\w+),\s*\}\);/m,
    newReplacement: `const $1 = await api.post('/api/uploads/image', $2);`
  },
  {
    file: path.join(basePath, 'features', 'menu', 'AddMenuItemPage.tsx'),
    oldRegex: /const (\w+) = await fetch\('\/api\/uploads\/image',\s*\{\s*method:\s*'POST',\s*credentials:\s*'include',\s*body:\s*(\w+),\s*\}\);/m,
    newReplacement: `const $1 = await api.post('/api/uploads/image', $2);`
  },
  {
    file: path.join(basePath, 'features', 'company', 'CompanyProfilePage.tsx'),
    oldRegex: /const (\w+) = await fetch\('\/api\/uploads\/image',\s*\{\s*method:\s*'POST',\s*credentials:\s*'include',\s*body:\s*(\w+),\s*\}\);/m,
    newReplacement: `const $1 = await api.post('/api/uploads/image', $2);`
  },
  {
    file: path.join(basePath, 'features', 'branches', 'AddBranchPage.tsx'),
    oldRegex: /const (\w+) = await fetch\('\/api\/uploads\/image',\s*\{\s*method:\s*'POST',\s*credentials:\s*'include',\s*body:\s*(\w+),\s*\}\);/m,
    newReplacement: `const $1 = await api.post('/api/uploads/image', $2);`
  }
];

let successCount = 0;
let failureCount = 0;

replacements.forEach(({ file, oldRegex, newReplacement }, index) => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (!oldRegex.test(content)) {
      console.error(`❌ [${index + 1}] Regex not matched in ${file}`);
      failureCount++;
      return;
    }
    const updated = content.replace(oldRegex, newReplacement);
    
    // Also remove the if (uploadRes.ok) line since axios throws on !ok, 
    // And actually change the logic so we get response data properly.
    // However, if the code already relies on (uploadRes.ok) we should strip it properly.
    // We already changed `uploadRes.json()` to `.data` randomly earlier.
    // Instead of doing arbitrary regex replacements, let's just do:
    let finalUpdate = updated.replace(/if \(\w+\.ok\)\s*\{/, '');
    
    fs.writeFileSync(file, updated, 'utf8');
    console.log(`✅ [${index + 1}] Replaced in ${file}`);
    successCount++;
  } catch (error) {
    console.error(`❌ [${index + 1}] ERROR: ${error.message} on ${file}`);
    failureCount++;
  }
});

console.log(`Success: \${successCount}, Failures: \${failureCount}`);
