import {z} from "zod"
import {GoogleGenAI} from "@google/genai"
import Configurator from "./ControlerConfigurator"
import {
    ConfigSchema, 
    Configuracao, 
    Elements, 
    DescriptionSchemaParsed
} from "./types$schemas"
import {By, until} from "selenium-webdriver"
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
        this.#driver.sleep(6000)
    }

    // manda a ia pegar as informacoes importantes
    async askAiForGetDescriptionDetais(descText: string){
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

        // colocar um wait para a tag ul, aqui
        
        const descriptionTag = this.#driver.findElement(By.xpath(this.#elements.vacancyDescriptionTag))
        const descText = await descriptionTag.getText()
        // console.log(descText)

        // const requisitos = await this.askAiForGetDescriptionDetais(descText)
        const requisitos: string[] = []

        return [descText, requisitos]
    }
    
    // relacionado a data de publicacao
    async getANDTranformPublishedDate(): Promise<Date | null>{
        
        function transformaTimeInDays(number: number, time: string){

            let newTime = time

            // se o numero for mais q 1 ele sera plural
            // entao devemos padronizar para o sinngular
            if(number > 1){
                let qtd_slice = 1
                if(time == "meses"){
                    qtd_slice = 2
                }
                newTime = newTime.slice(0, newTime.length - qtd_slice)
            }

            let qtd_dias;

            switch(newTime){
                case "dia":
                    qtd_dias = number
                break
                case "semana":
                    qtd_dias = number * 7
                break
                case "mes":
                    qtd_dias = number * 30
                break
                default:
                    qtd_dias = 0
            }

            const currentDate = new Date()
            const pastDate = new Date(currentDate.setDate(currentDate.getDate() - Number(qtd_dias)))
            newTime = `${pastDate.getFullYear()}-${pastDate.getMonth() + 1}-${pastDate.getDate()}`

            return newTime
            
        }
        
        try{

            const span = await this.#driver.wait(until.elementLocated(By.xpath(this.#elements.publishDate)), 5000)
            const allSpanText = await span.getText()
            // console.log(`\x1b[32m ${allSpanText} \x1b[30m`)
            const {groups} = allSpanText.match(/há (?<number>\d+) (?<word>\w+)/)
            const text = groups.word
            const {number} = groups
            
            const published_date = new Date(transformaTimeInDays(number, text))
            return published_date
        }catch(e){
            return null
        }


    }

    // new name: "start to get vacancies"
    // separar em outra classe
    async getBasicInfos(){
        // pega a lista <ul>
        const lista = await this.#driver.wait(until.elementLocated(By.xpath(this.#elements.lista)), 5000)

        // <li>s
        const elements = await lista.findElements(By.css(":scope > *"))
        
        console.log(elements.length)
        let qtd = 1
        for await (const item of elements){
            await this.#driver.executeScript("arguments[0].scrollIntoView()", item)
            await item.click()
            const slw = await item.findElements(By.css(":scope > div > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div"))

            // separar em outro metodo (verify on Data Base)
            const currentUrl = await this.#driver.getCurrentUrl()
            const url = new URL(currentUrl)
            const jobId = url.searchParams.get("currentJobId")
            const {rows} = await this.#databaseConnection.query("SELECT jobid FROM vagas WHERE jobid = $1", [jobId])
            // console.log(rows)
            
            // se o titulo ja existir passa pro proximo
            if(rows.length){
                if(rows[0]?.jobid == jobId)
                    continue
            }
            
            
            let title = await slw[0].getText()
            title = title.split("\n")[0]
            
            const empresa = await slw[1].getText()
            
            const regiao = await slw[2].getText()
            
            let macthModalidade = regiao.match(/\((?<modalidade>[a-zA-ZÀ-ú]+)\)$/)
            if(macthModalidade){
                macthModalidade = macthModalidade.groups.modalidade
            }

            // modalidade = modalidade[0].slice(1, modalidade[0].length - 1)
            const dt_publicado = await this.getANDTranformPublishedDate()
                
            // console.log(`\x1b[33m ${jobId} \x1b[30m`)
            // console.log(title)
            // console.log(modalidade)
            // console.log(dt_publicado)
            // console.log(empresa)
            // console.log(regiao)
            // console.log("\n")
            const [descricao, requisitos] = await this.getDescriptionsInfos()
            
            // criar um tipo para os dados recebidos, e verificar com o zod
            const data: any = {
                title,
                empresa,
                regiao,
                descricao,
                keywords: this.#configs.keywords,
                site: this.#configs.site,
                jobId,
                currentUrl,
                macthModalidade,
                dt_publicado
                
                // requisitos,
            }
            // salva no banco
            // this.saveVacancyOnDataBase(data)
            console.log(`${qtd}/${elements.length}`)
            qtd++
            // break
    }
    console.log("Terminol!")
    }

    // salva no banco
    async saveVacancyOnDataBase(data: any){
        console.log("\x1b[32m ==========================")
        const conn = await this.#databaseConnection.connect()
        // await this.#databaseConnection.connect()
        const {rows: desc} = await conn.query("INSERT INTO descricoes (descricao) VALUES ($1) RETURNING id", [data.descricao])
        const desc_id = desc[0].id
        try{

            await conn.query("INSERT INTO vagas(titulo, empresa, cidade, keywords, plataforma, jobid, link, descricao_fk, modalidade, dt_vac_published) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [data.title, data.empresa, data.regiao, data.keywords, data.site, data.jobId, data.currentUrl, desc[0].id, data.modalidade, data.dt_publicado])
            
            // se falhar ele apaga a descricao, pra ela nao ficar sozinha
        }catch(e){
            await conn.query("DELETE FROM descricoes WHERE id = $1", [desc_id])
        }
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