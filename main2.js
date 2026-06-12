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
        searchWords: ["front-end", "back-end", "estagio"], 
        aiKey: process.env.AIAPIKEY, 
        cidade: "sumare, sao paulo", 
        keywords: ["front-end", "back-end", "full-stack", "node", "JavaScript", "React", "Nextjs", "Postgres", "TypeScript", "Nest"],
        aiRequired: false,
        otherAiCriterions: `A vaga pecisa ser no horario depois das 13:00, pois de manha tenho faculdade. Alem do mais, sou Junior, entao busco vagas que nao exija experiencia solida ou de varios anos. Mas se ela pedir experiencia com projetos, ja fiz alguns, com as tecnologias listadas em "keywords". Se a vaga pedir um nivel de experiencia maior que de um junior a vaga nao podera ser perfeita. Se a vaga pedir alguma outra tecnologia fora das listadas em "keywords" como requisitos a vaga tambem nao podera ser perfeita.`,
        paginas: 100,
        minQtdToAnalise: 30,
        soundsEnabled: false
    }

    const controler = new Contoler({dbConn, userConfigs, driver})
    process.on("uncaughtException", (e) =>{
       console.log(e)
       console.log("erro!")        
       controler.playAudios("error")
       driver.quit()
    })
    
    await controler.getWebSite()
    const slw = await controler.startToGetVacancies()
    // const slw2 = await controler.startTogetVacaciesV2()
    await driver.sleep(4500)

    driver.quit()
}

main()