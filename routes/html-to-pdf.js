var express = require('express')
var router = express.Router()
const puppeteer = require('puppeteer')

/* GET users listing. */
router.get('/', function (req, res, next) {
  (async () => {
    const {url} = req.query
    console.log(url)
    const buffer = await generatePDF(url)
    res.send(buffer)
  })()
})

async function generatePDF (url) {
  const browser = await puppeteer.launch({headless: true}) // Puppeteer can only generate pdf in headless mode.
  const page = await browser.newPage()
  await page.goto(url)
  const pdfConfig = {
    path: 'url.pdf', // Saves pdf to disk.
    format: 'A4',
    printBackground: true,
    margin: { // Word's default A4 margins
      top: '2.54cm',
      bottom: '2.54cm',
      left: '2.54cm',
      right: '2.54cm'
    }
  }
  await page.emulateMedia('screen')
  const pdf = await page.pdf(pdfConfig) // Return the pdf buffer. Useful for saving the file not to disk.

  await browser.close()

  return pdf
}

module.exports = router
