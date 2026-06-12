const app = require('./app')

const port = Number(process.env.PORT || 5001)

app.listen(port, () => {
  console.log(`Home Electric Services API running on port ${port}`)
})
