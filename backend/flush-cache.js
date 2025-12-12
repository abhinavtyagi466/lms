// Quick script to flush the cache
// Can be run with: node backend/flush-cache.js
// Or just restart the backend server

const NodeCache = require('node-cache');

console.log('To clear the cache, simply restart the backend server.');
console.log('The cache is in-memory and will be cleared on restart.');
console.log('');
console.log('Run: npm run dev (in backend folder) to restart');
