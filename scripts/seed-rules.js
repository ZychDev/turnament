// Run: node scripts/seed-rules.js <admin-password>
// Seeds the rules from REGULAMIN.txt into the database via API

const fs = require('fs');
const path = require('path');

const password = process.argv[2];
if (!password) {
  console.error('Usage: node scripts/seed-rules.js <admin-password>');
  process.exit(1);
}

const rulesPath = path.join(__dirname, '..', 'REGULAMIN.txt');
const rules = fs.readFileSync(rulesPath, 'utf-8');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';

fetch(`${BASE_URL}/api/admin/config`, {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${password}`,
  },
  body: JSON.stringify({ rules }),
}).then(async r => {
  if (r.ok) {
    console.log('Rules saved successfully!');
  } else {
    const err = await r.json().catch(() => ({}));
    console.error('Error:', err.error || r.status);
  }
}).catch(e => console.error('Failed:', e.message));
