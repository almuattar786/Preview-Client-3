/**
 * MongoDB to MySQL Migration Runner
 * Usage: node scripts/migrate-mongodb-to-mysql.js
 */
const { execSync } = require('child_process');
console.log('Running TypeScript migration via tsx...');
try {
  execSync('npx tsx scripts/migrate-mongodb-to-mysql.ts', { stdio: 'inherit' });
} catch (err) {
  process.exit(1);
}
