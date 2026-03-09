const {Builder} = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")
const Contoler = require("./dist/Controler")
require("dotenv").config()
const {Pool} = require("pg")

async function main(){

    const db = new Pool({
        user: "nk_gb7",
        password: process.env.DBPASSWD,
        port: 5432,
        database: "cvautomation"
    })

    const{rows} = await db.query("SELECT current_role")
    console.log(rows)

    const options = new chrome.Options()
    options.addArguments("user-data-dir=driver",
        // "--start-maximized"
    )

    const driver = new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build()
    console.log("iniciado")

    const dbConn = db
    const userConfigs = {site: "linkedin", searchWords: ["front"], aiKey: process.env.AIAPIKEY, cidade: "sumare, sao paulo"}

    const controler = new Contoler({dbConn, userConfigs, driver})
    
    await controler.getWebSite()
    const slw = await controler.getBasicInfos()
    await driver.sleep(4500)

    // driver.quit()
}

main()