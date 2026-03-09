import {GoogleGenAI} from "@google/genai"
import {
    ConfigSchema, 
    Configuracao, 
    UserConfigSchema,
    UserConfig,
    ListaDeSites,
    Elements
} from "./types$schemas"

class ControlerConfigurator{
    
    static basicVerificantionsOfUserConfigParam(
        {userConfigs, dbConn, driver}: 
        {userConfigs: UserConfig, dbConn: any, driver: any}){
        
        if(typeof userConfigs != "object"){
            throw new Error("Configuracoes tem que ser um Objeto!")
        }
        if(typeof dbConn != "object"){
            throw new Error("Banco de dados invalido!")
        }
        if(!driver){
            throw new Error("Driver invalido!")
        }

        // verifica os dados recebidos pelo usuario
        const statement = UserConfigSchema.safeParse(userConfigs)
        if(!statement.success){
            console.log(statement.error)
            throw new Error("Configuracoes invalidas")
        }

        try{
            const api_teste = new GoogleGenAI({apiKey: userConfigs.aiKey})
            this.testeAiAPI(api_teste)
        }catch(e){
            throw new Error("Chave da API ivalida ou nnao autorizada!")
        }
    }

    // da pra, ao invez de definir cada apropriedade, retornar um objeto com tudo ja configurado em apenas um
    // configura a URL basica
    static transformUrlOnConfigProperty(configs: Configuracao){
        const newObj = {...configs}
        newObj.url = new URL(this.sitesDefaultsConfigs(configs.site).host)
        newObj.url.pathname = this.sitesDefaultsConfigs(configs.site).pathname
        newObj.url.search = this.sitesDefaultsConfigs(configs.site).search + configs.searchWords[0]
        return {...newObj}
    }

    // configura a URL para cada opcao
    static sitesDefaultsConfigs(word: string){

        // tem que tipar esse objeto
        const opts: any = 
        {
            linkedin: {
                host: `https://${word}.com`,
                pathname: "jobs/",
                search: "keywords="
            },
            indeed: {
                host: `https://${word}.com`,
                pathname: "jobs",
                search: "q="
            },
            infojobs: {
                host: `https://${word}.com.br`,
                pathname: "empregos.aspx",
                search: "palabra="
            }
        }

        return opts[word]
    }

    // teste se a chave da API e valida
    static async testeAiAPI(apiInstance: GoogleGenAI){
        await apiInstance.models.list()
    }

    static instantiateGoogleGenAI(apiKey: string){
        const ai = new GoogleGenAI({apiKey})
        return ai
    }

    // pega todos os dados e transformar no Objeto valido de configuracao
    // basicamente: transformar a URL e cria a instancia da AI
    static parseConfigs(userData: UserConfig){
        let config = this.transformUrlOnConfigProperty(userData)
        // config = this.instantiateGoogleGenAI(config)
        return config
    }

    static setElementsTag(site: string){
        const opts: any = 
        {
            linkedin: {
                // xpath
                lista: '//*[@id="main"]/div/div[2]/div[1]/div/ul',
                // css
                singleVacancy: `:scope > li`,
                title: `//div[@class="ember-view"]/span[1]/strong`,
                empresa: `//*[@id="ember153"]/span`,
                regiao: `//*[@id="ember154"]/ul/li/span`,
                vacancyDescriptionTag: `//*[@id="job-details"]/div/p`,
                publishDate: '//*[@id="main"]/div/div[2]/div[2]/div/div[2]/div/div[2]/div[1]/div/div[1]/div/div[1]/div/div[3]/div/span'
            },
            indeed: {
                lista: ``,
                singleVacancy: ``,
                title: ``,
                empresa: ``,
                regiao: ``,
                vacancyDescriptionTag: ``,
                publishDate: ''
            },
            infojobs: {
                lista: ``,
                singleVacancy: ``,
                title: ``,
                empresa: ``,
                regiao: ``,
                vacancyDescriptionTag: ``,
                publishDate: ''
            },
        }

        return opts[site]
    }
}

export default ControlerConfigurator