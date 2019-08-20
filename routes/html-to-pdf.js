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
  const browser = await launchPuppeteer()
  const page = await browser.newPage()

  await page.goto(url, {waitUntil: 'networkidle0'})

  const pdfConfig = {
    format: 'A3',
    printBackground: true,
    margin: { // Word's default A4 margins
      top: '0',
      bottom: '0',
      left: '0',
      right: '0'
    }
  }
  await page.emulateMedia('screen')
  const pdf = await page.pdf(pdfConfig) // Return the pdf buffer. Useful for saving the file not to disk.

  await browser.close()
  return pdf
}

async function generatePdfFromUrlAndContent (url, content) {
  const browser = await launchPuppeteer()
  const page = await browser.newPage()
  if (url) {
    page.setRequestInterception(true);
    page.on('request', (request) => {
      if (['script'].indexOf(request.resourceType()) !== -1) {
        request.abort();
      } else {
        request.continue();
      }
    });

    await page.goto(url, {waitUntil: 'networkidle0'})

  } else {
    await page.goto(`data:text/html,<!DOCTYPE html><html><body></body></html>`, {waitUntil: 'networkidle0'})
  }

  await page.evaluate((content) => {
    document.body.innerHTML = content
  }, content)

  const pdfConfig = {
    format: 'A3',
    printBackground: false,
    margin: { // Word's default A4 margins
      top: '1cm',
      bottom: '1cm',
      left: '0cm',
      right: '0cm'
    }
  }
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
