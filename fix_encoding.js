const fs = require('fs');
let t = fs.readFileSync('e:/Projects/Portfolio_Hemant/index.html', 'utf8');
t = t.replace(/â€”/g, '—')
     .replace(/â†’/g, '→')
     .replace(/â€œ/g, '“')
     .replace(/â€\x9D/g, '”') // Handle right quote if different
     .replace(/â€™/g, '’')
     .replace(/â€“/g, '–')
     .replace(/â”€/g, '─');
fs.writeFileSync('e:/Projects/Portfolio_Hemant/index.html', t, 'utf8');
