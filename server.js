const { createServer } = require('node:http')
const next = require('next')

const port = Number(process.env.PORT || 3000)
const hostname = process.env.HOSTNAME || '0.0.0.0'
const app = next({ dev: false, hostname })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer((request, response) => handle(request, response)).listen(port, hostname, () => {
    console.log(`SutraKriti ready on http://${hostname}:${port}`)
  })
}).catch((error) => {
  console.error(error)
  process.exit(1)
})
