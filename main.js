const {Builder, By} = require("selenium-webdriver")
const chrome = require("selenium-webdriver/chrome")
const {Pool} = require("pg")
const { SeleniumServer } = require("selenium-webdriver/remote")
require("dotenv").config()

console.log(Pool)

const db = new Pool({
    user: process.env.USER,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT
})

db.query("SELECT NOW()")
.then(x => console.log(x.rows))
.catch(err => console.log("errro"))

db.end()

async function main(){
    const options = new chrome.Options()

    options.addArguments("user-data-dir=driver",)
    options.excludeSwitches(["--enable-automation"])

    const driver = new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build()

    await driver.get("https://www.linkedin.com/jobs/search/?keywords=react")
    
    // contem a div com as vagas
    const scroller = await driver.findElement(By.xpath('//*[@id="main"]/div/div[2]/div[1]/div'))

    const scroll = (element) => {
        element.scrollTop = element.scrollHeight
    }
    await driver.executeScript(scroll, scroller)
    console.log("executado!")

    // pega a lista de vagas (ul)
    const lista = await driver.findElement(By.xpath(`//*[@id="main"]/div/div[2]/div[1]/div/ul`))

    // pega cada item individualmente (li)
    // ":scope => elemento atual"
    const itens = await lista.findElements(By.css(":scope > *"))

    console.log(itens.length)

    let titlesElements = itens.map(x => x.findElements(By.tagName("strong")))

    titlesElements = await Promise.allSettled(titlesElements)
    
    // let titles = titlesElements.map(x => x.value[0])

    // titles = await Promise.all(titles)

    console.log(titlesElements)
    
    await driver.sleep(4000)
    
    // driver.quit()
}

main()