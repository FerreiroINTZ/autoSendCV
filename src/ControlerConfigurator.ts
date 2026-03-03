import {GoogleGenAI} from "@google/genai"
import {ConfigSchema, Configuracao} from "./types$schemas"

class ControlerConfigurator{
    
    static basicVerificantionsOfUserConfigParam(
        {userConfigs, dbConn, driver}: 
        {userConfigs: any, dbConn: any, driver: any}){
        
        if(typeof userConfigs != "object"){
            throw new Error("Configuracoes tem que ser um Objeto!")
        }
        if(typeof dbConn != "object"){
            throw new Error("Banco de dados invalido!")
        }
        if(!driver){
            throw new Error("Driver invalido!")
        }

        const statement = ConfigSchema.safeParse(userConfigs)
        if(!statement.success){
            // console.log(statement.error)
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
    static transformUrlOnConfigProperty(configs: any){
        const newObj = {...configs}
        newObj.url = new URL(this.sitesDefaultsConfigs(configs.site).host)
        newObj.url.pathname = this.sitesDefaultsConfigs(configs.site).pathname
        newObj.url.search = this.sitesDefaultsConfigs(configs.site).search + configs.keywords[0]
        return {...newObj}
    }

    // configura a URL para cada opcao
    static sitesDefaultsConfigs(word: string){

        const opts: any = 
        {
            linkedin: {
                host: `https://${word}.com`,
                pathname: "jobs/search/",
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
}

export default ControlerConfigurator