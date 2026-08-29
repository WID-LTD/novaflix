import dotenv from 'dotenv'
import fs from 'fs'
import jwt from 'jsonwebtoken'
dotenv.config({ path: './.env' })
const SECRET = fs.readFileSync('./.env','utf8').match(/^JWT_SECRET=(.*)$/m)[1]
const mk = (uid) => jwt.sign({ id: uid }, SECRET, { expiresIn: '1h' })
const U1 = '48aeea13-ac62-4b83-9116-d72b521e609b'
const BASE = 'http://127.0.0.1:3030/api'
async function api(uid, path, opts={}) {
  const r = await fetch(BASE+path, {...opts, headers:{Authorization:`Bearer ${mk(uid)}`, ...(opts.headers||{})}})
  return r.json()
}
const status = await api(U1, '/trivia/guess')
console.log('Guess status before playing:', JSON.stringify(status, null, 2))
process.exit(0)
