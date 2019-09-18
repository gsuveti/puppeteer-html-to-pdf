const express = require('express')
const puppeteer = require('puppeteer')
const router = express.Router()

const pdfConfig = {
  format: 'A4',
  printBackground: true,
  margin: { // Word's default A4 margins
    top: '2.54cm',
    bottom: '2.54cm',
    left: '2.54cm',
    right: '2.54cm'
  }
}

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
  const browser = await launchPuppeteer()
  const page = await browser.newPage()

  await page.goto(url, {waitUntil: 'networkidle0'})
  await page.emulateMedia('screen')
  const pdf = await page.pdf(pdfConfig) // Return the pdf buffer. Useful for saving the file not to disk.

  await browser.close()
  return pdf
}

async function generatePdfFromUrlAndContent (url, content) {
  const browser = await launchPuppeteer()
  const page = await browser.newPage()
  if (url) {
    page.setRequestInterception(true)
    page.on('request', (request) => {
      if (['script'].indexOf(request.resourceType()) !== -1) {
        request.abort()
      } else {
        request.continue()
      }
    })

    await page.goto(url, {waitUntil: 'networkidle0'})

  } else {
    await page.goto(`data:text/html,<!DOCTYPE html><html><body></body></html>`, {waitUntil: 'networkidle0'})
  }

  await page.evaluate((content) => {
    document.body.innerHTML = content
  }, content)

  await page.emulateMedia('screen')
  const pdf = await page.pdf(pdfConfig) // Return the pdf buffer. Useful for saving the file not to disk.

  await browser.close()
  return pdf
}

async function launchPuppeteer () {
  const browser = await puppeteer.launch(
    {
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      headless: true,
    }
  ) // Puppeteer can only generate pdf in headless mode.
  return browser
}

module.exports = router
