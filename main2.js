const {Builder} = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")
const Contoler = require("./dist/Controler")

async function main(){

    const options = new chrome.Options()
    options.addArguments("user-data-dir=driver")

    const driver = new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build()
    console.log("iniciado")

    const dbConn = {}
    const configs = {site: "infojobs", keywords: ["front"]}
    const driverObj = driver

    const controler = new Contoler({dbConn, configs, driver: driverObj})
    
    await controler.getWebSite()

    // driver.quit()
}

main()