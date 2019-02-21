var express = require('express')
var puppeteer = require('puppeteer')
var router = express.Router()

router.get('/', function (req, res, next) {
  (async () => {
    const {url} = req.query
    const buffer = await generatePdfFromUrl(url)
    res.contentType('application/pdf')
    res.send(buffer)
  })()
})

router.post('/', function (req, res, next) {
  (async () => {
    const content = req.body
    const {url} = req.query
    const buffer = await generatePdfFromUrlAndContent(url, content)
    res.contentType('application/pdf')
    res.send(buffer)
  })()
})

async function generatePdfFromUrl (url) {
  const browser = await puppeteer.launch({headless: true}) // Puppeteer can only generate pdf in headless mode.
  const page = await browser.newPage()

  await page.goto(url, {waitUntil: 'networkidle0'})

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

async function generatePdfFromUrlAndContent (url, content) {
  const browser = await puppeteer.launch({headless: true}) // Puppeteer can only generate pdf in headless mode.
  const page = await browser.newPage()
  if (url) {
    await page.goto(url, {waitUntil: 'networkidle0'})
  } else {
    await page.goto(`data:text/html,<!DOCTYPE html><html><body></body></html>`, {waitUntil: 'networkidle0'})
  }

  await page.evaluate((content) => {
    document.body.innerHTML = content
  }, content)

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
