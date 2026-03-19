import {z} from "zod"
import {GoogleGenAI} from "@google/genai"

import Configurator from "./configurator/configurator"
import DataBaseContoler from "./db/DatabaseControler"
import AIControler from "./ai/AIControler"
import Utils from "./utils/utils"

import {
    ConfigSchema, 
    Configuracao, 
    Elements, 
    DescriptionSchemaParsed
} from "./types/types$schemas"

import {By, until, Key} from "selenium-webdriver"
import {Pool} from "pg"
import fs from "fs"

function composition(...clases: any[]){

    const Clases = []
    for(let y = 0; y < clases.length; y++){
        
    }

}

class Controler extends Utils{
    #driver: any;
    #elements: Elements;
    
    #databaseConnection: Pool;
    #iaSDK: GoogleGenAI;
    #configs: Configuracao;

    constructor(
        data: 
        {dbConn: any, userConfigs: Configuracao, driver: any}
    ){
        // faz as verificacoes basicas
        Configurator.basicVerificantionsOfUserConfigParam(data)
        
        // seta as propriedades da classe Utils
        const elements = Configurator.setElementsTag(data.userConfigs.site)
        super(data.driver, elements)

        this.#configs = Configurator.parseConfigs(data.userConfigs)
        this.#configs.paginas = data.userConfigs.paginas || 1
        this.#databaseConnection = data.dbConn
        this.#driver = data.driver
        this.#elements = elements
        this.#iaSDK = Configurator.instantiateGoogleGenAI(data.userConfigs.aiKey)
        console.log(this.#configs.paginas)
    }

    // acessa o site
    async getWebSite(){
        await this.#driver.manage().window().setRect({width: 1000, heigth: 700})
        await this.#driver.get(this.#configs.url!.href)
        console.log(this.#configs.url!.href)
        this.#driver.sleep(6000)
        // await this.doResearch()
    }

    // faz a pesquisa, usando os inputs para isso
    // isso vai ficar obsoleto
    //
    // async doResearch(){
    //     const keywordInput = await this.#driver.wait(until.elementLocated(By.xpath('//*[@id="root"]/div[2]/div[2]/div[1]/header/div/div/div/div[2]/div/div/div/div/div[1]/div/div/input')), 8000)
    //     const cityInput = await this.#driver.wait(until.elementLocated(By.xpath('//*[@id="root"]/div[2]/div[2]/div[1]/header/div/div/div/div[2]/div/div/div/div/div[2]/div/input')), 5000)

    //     await keywordInput.sendKeys(this.#configs.searchWords[0])
    //     await cityInput.sendKeys(this.#configs.cidade)
    //     await cityInput.sendKeys(Key.ENTER)
    //     await this.#driver.sleep(10000)
    // }

    // manda a ia pegar as informacoes importantes
    async askAiForGetDescriptionDetais(descText: string){
        const resp = await this.#iaSDK.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `analise a seguinte descricao, identifique as informacoes do schema e retorne um json prenchido: 
            ${descText}`,
            config: {
                responseMimeType: "application/json",
                responseJsonSchema: DescriptionSchemaParsed
            }
        })
        console.log(resp.text)
    }

    // new name: "start_to_get_vacancies"
    async startToGetVacancies(){

        // pega a lista <ul>
        let lista: any;
        try{
            const listas = await this.#driver.wait(until.elementLocated(By.xpath(this.#elements.lista)), 20 * 1000)
            lista = listas

            //*[@id="main"]/div/div[2]/div[1]/div/ul
            // const rpz = await this.#driver.executeScript(() => document.getElementById("main"))
            // console.log(await rpz.getTagName())
        }catch(e){
            //*[@id="main"]/div/div[2]/div[1]/div/ul
            const shot = await this.#driver.takeScreenshot()
            await fs.promises.writeFile("./photo.png", shot, "base64")
            throw new Error("Lista (<ul>) nao encontrado!")
        }finally{
            // this.#driver.quit()
        }

        
        // <li>s
        const elements = await lista.findElements(By.css(":scope > *"))
        console.log("pegou a lista")
        console.log(elements.length)
        // return null
        let qtd = 1
        for await (const item of elements){
            
            // lista quantos ja foram em comparacao aos que faltam
            process.stdout.write(`${qtd}/${elements.length}`)
            qtd++

            // scrolla ate o elemento atual
            await this.#driver.executeScript("arguments[0].scrollIntoView()", item)
            await item.click()
            const mainElementsTag = await item.findElements(By.css(":scope > div > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div"))

            // separar em outro metodo (verify on Data Base)
            // para isso sera preciso instancias o "DatabaseControler" tambem
            // (pendencia futura)
            const currentUrl = await this.#driver.getCurrentUrl()
            const url = new URLSearchParams(currentUrl.search)
            const jobId = url.get("currentJobId")
            const {rows} = await this.#databaseConnection.query("SELECT jobid FROM vagas WHERE jobid = $1", [jobId])
            // console.log(rows)
            
            // se o titulo ja existir passa pro proximo
            if(rows.length){
                if(rows[0]?.jobid == jobId)
                    console.log("\x1b[33m Ja existe essa vaga! \x1b[30m")
                    continue
            }
            
            
            let title = await mainElementsTag[0].getText()
            title = title.split("\n")[0]
            const empresa = await mainElementsTag[1].getText()
            const regiao = await mainElementsTag[2].getText()
            let macthModalidade = regiao.match(/\((?<modalidade>[a-zA-ZÀ-ú]+)\)$/)
            // se o REGEX der certo ele verifica se existe o grupo
            if(macthModalidade){
                macthModalidade = macthModalidade.groups.modalidade
            }
            // modalidade = modalidade[0].slice(1, modalidade[0].length - 1)
            const dt_publicado = await this.getANDTranformPublishedDate()
            // pega a descricao, e os requisitos com IA
            const [descricao, requisitos] = await this.getDescriptionsInfos()
            
            // criar um tipo para os dados recebidos, e verificar com o zod
            const data: any = {
                title,
                empresa,
                regiao,
                descricao,
                keywords: this.#configs.searchWords,
                site: this.#configs.site,
                jobId,
                currentUrl,
                macthModalidade,
                dt_publicado
                
                // requisitos,
            }
            // salva no banco
            await this.saveVacancyOnDataBase(data)
            // break
    }
    console.log("Terminou!")
    }

    // searar esse metodo no banco
    // salva no banco
    async saveVacancyOnDataBase(data: any){
        const conn = await this.#databaseConnection.connect()
        // await this.#databaseConnection.connect()
        const {rows: desc} = await conn.query("INSERT INTO descricoes (descricao) VALUES ($1) RETURNING id", [data.descricao])
        const desc_id = desc[0].id
        try{

            await conn.query("INSERT INTO vagas(titulo, empresa, cidade, keywords, plataforma, jobid, link, descricao_fk, modalidade, dt_vac_published) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)", [data.title, data.empresa, data.regiao, data.keywords, data.site, data.jobId, data.currentUrl, desc[0].id, data.modalidade, data.dt_publicado])
            
            // se falhar ele apaga a descricao, pra ela nao ficar sozinha
        }catch(e){
            console.log("\x1b[32m Erro ao salvar no Banco! \x1b[30m")
            await conn.query("DELETE FROM descricoes WHERE id = $1", [desc_id])
        }finally{
            console.log("\x1b[32m Salvo no Banco! \x1b[30m ")
            conn.release()
        }
    }

    // async getRequirements(){
    //     const lista = await this.#driver.findElement(By.xpath(this.#elements.lista))
    // }

    getProperties(){
        console.log(this.#driver)
    }
}

export = Controler