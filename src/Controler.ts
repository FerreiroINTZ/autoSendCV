import {z} from "zod"
import {GoogleGenAI} from "@google/genai"
import Configurator from "./ControlerConfigurator"
import {
    ConfigSchema, 
    Configuracao, 
    Elements, 
    DescriptionSchemaParsed
} from "./types$schemas"
import {By} from "selenium-webdriver"
import {Pool} from "pg"

class Controler{
    #databaseConnection: Pool;
    #configs: Configuracao;
    #driver: any;
    #elements: Elements;
    #iaSDK: GoogleGenAI;

    constructor(
        data: 
        {dbConn: any, userConfigs: Configuracao, driver: any}
    ){
        // faz as verificacoes basicas
        Configurator.basicVerificantionsOfUserConfigParam(data)

        this.#configs = Configurator.parseConfigs(data.userConfigs)
        this.#databaseConnection = data.dbConn
        this.#driver = data.driver
        this.#elements = Configurator.setElementsTag(data.userConfigs.site)
        this.#iaSDK = Configurator.instantiateGoogleGenAI(data.userConfigs.aiKey)
    }

    // acessa o site
    async getWebSite(){
        await this.#driver.get(this.#configs.url!.href)
    }

    // manda a ia pegar as informacoes importantes
    async asAiForGetDescDetais(descText: string){
        const resp = await this.#iaSDK.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `analise a seguinte descricao, identifique as informacoes do schema e retorne um josn com o schema prenchido: 
            ${descText}`,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: DescriptionSchemaParsed
            }
        })
        console.log(resp.text)
    }

    // pega o texto da descricao; e joga na IA para analisar
    async getDescriptionsInfos(){
        const descriptionTag = this.#driver.findElement(By.xpath(this.#elements.vacancyDescriptionTag))
        const descText = await descriptionTag.getText()
        // console.log(descText)

        // const requisitos = await this.asAiForGetDescDetais(descText)
        const requisitos: string[] = []

        return [descText, requisitos]
    }

    // new name: "start to get vacancies"
    async getBasicInfos(){
        // pega a lista <ul>
        const lista = await this.#driver.findElement(By.xpath(this.#elements.lista))

        // <li>s
        const elements = await lista.findElements(By.css(":scope > *"))
        
        console.log(elements.length)
        for await (const item of elements){
            await this.#driver.executeScript("arguments[0].scrollIntoView()", item)
            await item.click()
            const slw = await item.findElements(By.css(":scope > div > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div"))
            console.log(slw.length)

            let title = await slw[0].getText()
            title = title.split("\n")[0]
            console.log(title)
            const {rows} = await this.#databaseConnection.query("SELECT titulo FROM vagas WHERE titulo = $1", [title])
            console.log(rows)

            // se o titulo ja existir passa pro proximo
            if(rows.length){
                if(rows[0]?.titulo == title)
                continue
            }

            
            const empresa = await slw[1].getText()
            const regiao = await slw[2].getText()
            console.log(empresa)
            console.log(regiao)
            const currentUrl = await this.#driver.getCurrentUrl()
            const url = new URL(currentUrl)
            const jobId = url.searchParams.get("currentJobId")
            console.log(`\x1b[33m ${jobId} \x1b[30,`)
            console.log("\n")
            const [descricao, requisitos] = await this.getDescriptionsInfos()
            
            const data: any = {
                title,
                empresa,
                regiao,
                descricao,
                keywords: this.#configs.keywords,
                site: this.#configs.site,
                jobId,

                // requisitos,
                // currentUrl,
            }

            this.saveVacancyOnDataBase(data)
            break
        }
    }

    async saveVacancyOnDataBase(data: any){
        console.log("\x1b[32m ==========================")
        const conn = await this.#databaseConnection.connect()
        // await this.#databaseConnection.connect()
        await conn.query("INSERT INTO vagas(titulo, empresa, cidade, keywords, plataforma, jobid, link) VALUES ($1, $2, $3, $4, $5, $6, $7)", [data.title, data.empresa, data.regiao, data.keywords, data.site, data.jobId])
        conn.release()
    }

    // async getRequirements(){
    //     const lista = await this.#driver.findElement(By.xpath(this.#elements.lista))
    // }

    getProperties(){
        console.log(this.#driver)
    }
}

export = Controler