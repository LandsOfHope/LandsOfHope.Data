const service = require('../package.json');
const fs = require('fs');

fs.writeFileSync('health', JSON.stringify({
    ...service,
    status: 200,
    message: 'all systems go',
    env: 'production',
    timestamp: Date.now()
}));