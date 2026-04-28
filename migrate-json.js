const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'kettan.client', 'src');

const files = [
  path.join(basePath, 'features', 'staff', 'StaffPage.tsx'),
  path.join(basePath, 'features', 'settings', 'SettingsPage.tsx'),
  path.join(basePath, 'features', 'menu', 'MenuItemProfilePage.tsx'),
  path.join(basePath, 'features', 'menu', 'AddMenuItemPage.tsx'),
  path.join(basePath, 'features', 'company', 'CompanyProfilePage.tsx'),
  path.join(basePath, 'features', 'branches', 'AddBranchPage.tsx')
];

files.forEach((file, index) => {
  try {
    let content = fs.readFileSync(file, 'utf8');
    
    // Replace `await uploadRes.json().catch` with `uploadRes.data` just to be safe if it doesn't throw (like if validateStatus is tweaked, which isn't here, but still)
    content = content.replace(/await (\w+)\.json\(\)\.catch\(\(\) => \(\{\}\)\)/g, '$1.data');
    content = content.replace(/await (\w+)\.json\(\)/g, '$1.data');

    fs.writeFileSync(file, content, 'utf8');
    console.log(`✅ [${index + 1}] Replaced .json() in ${file}`);
  } catch (error) {
    console.error(`❌ [${index + 1}] ERROR: ${error.message} on ${file}`);
  }
});
