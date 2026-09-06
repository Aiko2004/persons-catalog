// Runs before `ng build --configuration=production` on Vercel.
// Set API_URL in Vercel environment variables to the Render backend URL.
const fs = require('fs');
const path = require('path');

const apiUrl = process.env.API_URL || '';
const content = `export const environment = {\n  apiUrl: '${apiUrl}',\n};\n`;

const dest = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
fs.writeFileSync(dest, content, 'utf8');
console.log(`environment.prod.ts → apiUrl: '${apiUrl}'`);
