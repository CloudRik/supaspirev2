const jwt = require('/home/ubuntu/backend/node_modules/jsonwebtoken');
const http = require('http');

const userId = '931dcd1f-a757-4681-8fd5-f080ed10a1ee';
const secret = 'super_secret_jwt_key_12345';
const token = jwt.sign({ userId }, secret, { expiresIn: '1h' });

const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/projects/elegant/analytics?timeRange=7d&env=production',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${token}`
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    console.log('Response:', data);
  });
});

req.on('error', (e) => {
  console.error('Error:', e);
});

req.end();
