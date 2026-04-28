const fs = require('fs');
const path = require('path');

const files = [
    'src/features/staff/staffApi.ts',
    'src/features/reports/reportsApi.ts',
    'src/features/menu/menuItemsApi.ts',
    'src/features/menu/menuCategoryApi.ts',
    'src/features/hq-inventory/vehicleApi.ts',
    'src/features/hq-inventory/itemCategoryApi.ts',
    'src/features/branches/branchesApi.ts'
];

for (const file of files) {
    const fullPath = path.join(__dirname, 'kettan.client', file);
    let content = fs.readFileSync(fullPath, 'utf8');

    // add import if not exists
    if (!content.includes("from '../../utils/api'") && !content.includes("from '../../../utils/api'")) {
        // determine relative path depth
        const depth = file.split('/').length - 2;
        const relativePath = depth === 3 ? '../../../utils/api' : '../../utils/api';
        content = `import { api } from '${relativePath}';\n` + content;
    }

    // replace request wrapper (with or without options)
    const requestRegex = /async function request<T>\(url: string(?:, options\?: RequestInit)?\): Promise<T> \{[\s\S]*?return res\.json\(\)(?: as Promise<T>)?;\n\}/m;
    const newRequest = `async function request<T>(url: string, options?: RequestInit): Promise<T> {
  try {
    const res = await api({
      url,
      method: options?.method || 'GET',
      data: options?.body ? JSON.parse(options.body as string) : undefined,
      headers: options?.headers as any,
    });
    return res.data;
  } catch (error: any) {
    throw new Error(error.response?.data?.message || \`Request failed: \${error.message}\`);
  }`;

    if (requestRegex.test(content)) {
        content = content.replace(requestRegex, newRequest);
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated ${file}`);
    } else {
        console.log(`Could not find request function in ${file}`);
        // Let's check if it's slightly different
    }
}
