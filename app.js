const fetch = require('node-fetch')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const dotenv = require('dotenv')
const argv = yargs(hideBin(process.argv)).argv
const fs = require('fs')
var csv = require('csv-parser')
const _ = require('highland')

dotenv.config()

var results = {}
var tokenPortFolio = {}
global.fetch = fetch
const cc = require('cryptocompare')

cc.setApiKey(process.env.CC_API)

function first() {
  const stream = _(fs.createReadStream('./transactions.csv').pipe(csv()))
    .map((data) => ({
      ...data,
      amount: Number(data.amount),
    }))

    .each(async (data) => {
      var token = data.token
      var amount = data.amount
      var transtype = data.transaction_type
      updatePortFolio(token, amount, transtype)
    })

    .on('end', async () => {
      await getPortFolioPerToken()
    })
}

function second(token) {
  if (token == NaN) {
    console.error('Wrong format')
    return
  }
  var portfolio = 0
  let currentIndex = 0
  const stream = _(fs.createReadStream('./transactions.csv').pipe(csv()))
    .map((data) => ({
      ...data,
      amount: Number(data.amount),
    }))

    .filter((data) => data.token == token)

    .each(async (data) => {
      var amount = data.amount
      var transtype = data.transaction_type
      portfolio = await updatePortFolio(token, amount, transtype)
    })

    .on('end', async () => {
      await getPortFolio(token, portfolio)
    })
}

async function third(date) {
  if (new Date(date) == 'Invalid Date') {
    console.error(new Date(date))
    return
  }
  var timestamp = await toTimestamp(date)
  const stream = _(fs.createReadStream('./transactions.csv').pipe(csv()))
    .map((data) => ({
      ...data,
      amount: Number(data.amount),
      timestamp: parseInt(data.timestamp),
    }))
    .filter((data) => data.timestamp <= timestamp)

    .each(async (data) => {
      var token = data.token
      var amount = data.amount
      var transtype = data.transaction_type
      updatePortFolio(token, amount, transtype)
    })
    .on('end', async () => {
      await getPortFolioPerTokenDate(date)
    })
}

function fourth(date, token) {
  if (new Date(date) == 'Invalid Date') {
    console.error(new Date(date))
    return
  }
  var portfolio = 0
  const stream = _(
    fs.createReadStream('./transactions.csv', 'utf-8').pipe(csv())
  )
    .map((data) => ({
      ...data,
      amount: Number(data.amount),
      timestamp: parseInt(data.timestamp),
    }))

    .filter(
      (data) => data.timestamp <= toTimestamp(date) && data.token == token
    )

    .each(async (data) => {
      var amount = data.amount
      var transtype = data.transaction_type
      portfolio = await updatePortFolio(token, amount, transtype)
    })

    .on('end', async () => {
      await getPortFolioDateToken(token, portfolio, date)
    })
}

function updatePortFolio(currency, amount, type) {
  if (type == 'WITHDRAWAL') {
    amount = amount * -1
  }
  if (tokenPortFolio.hasOwnProperty(currency)) {
    tokenPortFolio[currency] += amount
    return tokenPortFolio[currency]
  } else {
    tokenPortFolio[currency] = amount
    return tokenPortFolio[currency]
  }
}
function getPortFolioPerToken() {
  Object.entries(tokenPortFolio).forEach(async ([key, value]) => {
    await cc
      .price(key, 'USD')
      .then((price) => {
        value = Number(price['USD']) * value
        console.log(`${key}: ${value}`)
        // -> { USD: 1100.24 }
      })
      .catch(console.error)
  })
}

async function getPortFolio(currency, value) {
  await cc
    .price(currency, 'USD')
    .then((price) => {
      value = Number(price['USD']) * value

      console.log(`${currency}: ${value}`)

      // -> { USD: 1100.24 }
    })
    .catch(console.error)
}

function getPortFolioPerTokenDate(date) {
  Object.entries(tokenPortFolio).forEach(async ([key, value]) => {
    await cc
      .priceHistorical(key, 'USD', new Date(date))
      .then((price) => {
        value = Number(price['USD']) * value
        console.log(`${key}: ${value}`)
        // -> { USD: 1100.24 }
      })
      .catch(console.error)
  })
}

async function getPortFolioDateToken(currency, value, date) {
  await cc
    .priceHistorical(currency, 'USD', new Date(date))
    .then((price) => {
      value = Number(price['USD']) * value

      console.log(`${currency}: ${value}`)

      // -> { USD: 1100.24 }
    })
    .catch(console.error)
}

const toTimestamp = (strDate) => {
  const dt = Date.parse(strDate)
  return dt / 1000
}

//Processing the
if (argv.token && !argv.date) {
  var tok = argv.token
  second(tok)
} else if (argv.date && !argv.token) {
  var date = argv.date
  third(date)
} else if (argv.date && argv.token) {
  var date = argv.date
  var token = argv.token
  fourth(date, token)
} else if (
  (argv.hasOwnProperty('token') && argv.token == '') ||
  (argv.hasOwnProperty('date') && argv.date == '')
) {
  console.error('wrong format')
} else {
  console.log('hello')
  first()
}
