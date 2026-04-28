const fs = require('fs');
const path = require('path');

const basePath = path.join(__dirname, 'kettan.client', 'src');

const replacements = [
  {
    file: path.join(basePath, 'features', 'staff', 'StaffPage.tsx'),
    old: /await fetch\('\/api\/uploads\/image', \{\s*method:\s*'POST',\s*body:\s*uploadFormData,\s*\}\)/,
    new: `await api.post('/api/uploads/image', uploadFormData)`,
  },
  {
    file: path.join(basePath, 'features', 'settings', 'SettingsPage.tsx'),
    old: /await fetch\('\/api\/uploads\/image', \{\s*method:\s*'POST',\s*body:\s*formData,\s*\}\)/,
    new: `await api.post('/api/uploads/image', formData)`,
  },
  {
    file: path.join(basePath, 'features', 'settings', 'SettingsPage.tsx'),
    old: /await fetch\('\/api\/auth\/profile',\s*\{\s*method:\s*'PUT',\s*headers:\s*\{[^}]+\},\s*body:\s*JSON\.stringify\({\s*name:\s*profileForm\.name,\s*imageUrl:\s*uploadedImageUrl,\s*}\),\s*\}\)/,
    new: `await api.put('/api/auth/profile', {
        name: profileForm.name,
        imageUrl: uploadedImageUrl,
      })`,
  },
  {
    file: path.join(basePath, 'features', 'menu', 'MenuItemProfilePage.tsx'),
    old: /await fetch\('\/api\/uploads\/image', \{\s*method:\s*'POST',\s*body:\s*uploadFormData,\s*\}\)/,
    new: `await api.post('/api/uploads/image', uploadFormData)`,
  },
  {
    file: path.join(basePath, 'features', 'menu', 'AddMenuItemPage.tsx'),
    old: /await fetch\('\/api\/uploads\/image', \{\s*method:\s*'POST',\s*body:\s*uploadFormData,\s*\}\)/,
    new: `await api.post('/api/uploads/image', uploadFormData)`,
  },
  {
    file: path.join(basePath, 'features', 'dashboard', 'components', 'SuperAdminDashboard.tsx'),
    old: /const res = await fetch\('\/api\/admin\/dashboard', \{ credentials: 'include' \}\);/,
    new: `const res = await api.get('/api/admin/dashboard');`,
  },
  {
    file: path.join(basePath, 'features', 'company', 'CompanyProfilePage.tsx'),
    old: /await fetch\('\/api\/uploads\/image', \{\s*method:\s*'POST',\s*body:\s*formData,\s*\}\)/,
    new: `await api.post('/api/uploads/image', formData)`,
  },
  {
    file: path.join(basePath, 'features', 'branches', 'AddBranchPage.tsx'),
    old: /fetch\('\/api\/users'\)\s*\.then\(\(?res\)? => res\.json\(\)\)/,
    new: `api.get('/api/users').then(res => res.data)`,
  },
  {
    file: path.join(basePath, 'features', 'branches', 'AddBranchPage.tsx'),
    old: /await fetch\('\/api\/uploads\/image', \{\s*method:\s*'POST',\s*body:\s*uploadFormData,\s*\}\)/,
    new: `await api.post('/api/uploads/image', uploadFormData)`,
  },
  {
    file: path.join(basePath, 'features', 'analytics', 'AnalyticsPage.tsx'),
    old: /const res = await fetch\('\/api\/admin\/analytics', \{ credentials: 'include' \}\);/,
    new: `const res = await api.get('/api/admin/analytics');`,
  },
  {
    file: path.join(basePath, 'features', 'analytics', 'AnalyticsPage.tsx'),
    old: /const res = await fetch\('\/api\/admin\/dashboard', \{ credentials: 'include' \}\);/,
    new: `const res = await api.get('/api/admin/dashboard');`,
  }
];

let successCount = 0;
let failureCount = 0;

replacements.forEach((replacement, index) => {
  try {
    const content = fs.readFileSync(replacement.file, 'utf8');
    
    if (!replacement.old.test(content)) {
      console.error(`❌ [${index + 1}] Not found in ${replacement.file} - ${replacement.old}`);
      failureCount++;
      return;
    }

    const updated = content.replace(replacement.old, replacement.new);
    fs.writeFileSync(replacement.file, updated, 'utf8');
    
    console.log(`✅ [${index + 1}] Replaced in ${replacement.file}`);
    successCount++;
  } catch (error) {
    console.error(`❌ [${index + 1}] ERROR: ${error.message} on ${replacement.file}`);
    failureCount++;
  }
});

console.log(`Success: ${successCount}, Failures: ${failureCount}`);
