import bcrypt from 'bcryptjs'

const pwd = process.argv[2]
if (!pwd) {
  console.error('Usage: node server/scripts/generate-hash.js <password>')
  process.exit(1)
}
if (pwd.length < 8) {
  console.error('Password must be at least 8 characters')
  process.exit(1)
}
const hash = await bcrypt.hash(pwd, 12)
console.log(hash)
