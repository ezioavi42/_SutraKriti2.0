const fs = require('node:fs')
const path = require('node:path')

const root = path.resolve(__dirname, '..')
const standalone = path.join(root, '.next', 'standalone')
const copies = [
  [path.join(root, 'public'), path.join(standalone, 'public')],
  [path.join(root, '.next', 'static'), path.join(standalone, '.next', 'static')],
]

if (!fs.existsSync(path.join(standalone, 'server.js'))) {
  throw new Error('Standalone server build is missing. Run next build first.')
}

for (const [source, destination] of copies) {
  fs.rmSync(destination, { recursive: true, force: true })
  fs.cpSync(source, destination, { recursive: true })
}

console.log('Prepared standalone public assets.')
