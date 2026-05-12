const {Builder} = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")
const Contoler = require("./dist/Controler")
require("dotenv").config()

async function main(){

    const options = new chrome.Options()
    options.addArguments("user-data-dir=driver",
        "--window-size=1000,800"
    )

    options.excludeSwitches("enable-automation")
    options.addArguments('--disable-blink-features=AutomationControlled')

    const driver = new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build()
    console.log("iniciado")

    const dbConn = "posgresql://nk_gb7:nk@localhost:5432/cvautomation"
    const userConfigs = {
        site: "linkedin", 
        searchWords: ["front-end", "back-end"], 
        aiKey: process.env.AIAPIKEY, 
        cidade: "sumare, sao paulo", 
        keywords: ["front-end", "back-end", "full-stack", "node", "JavaScript", "React", "Nextjs", "Postgres", "TypeScript", "Nest"],
        aiRequired: false,
        otherAiCriterions: "A vaga pecisa ser no horario depois das 13:00, pois de manah tenho faculdade.",
        paginas: 10
    }

    const controler = new Contoler({dbConn, userConfigs, driver})
    
    await controler.getWebSite()
    const slw = await controler.startToGetVacancies()
    await driver.sleep(4500)

    driver.quit()
}

main()