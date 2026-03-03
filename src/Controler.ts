import {z} from "zod"
import {GoogleGenAI} from "@google/genai"
import Configurator from "./ControlerConfigurator"
import {ConfigSchema, Configuracao} from "./types$schemas"

class Controler{
    #databaseConnection: Object;
    #configs: Configuracao;
    #driver: any;

    constructor(
        data: 
        {dbConn: Object, userConfigs: Configuracao, driver: any}
    ){
        // faz as verificacoes basicas
        Configurator.basicVerificantionsOfUserConfigParam(data)

        this.#configs = Configurator.transformUrlOnConfigProperty(data.userConfigs)
        this.#databaseConnection = data.dbConn
        this.#driver = data.driver
    }

    async getWebSite(){
        await this.#driver.get(this.#configs.url!.href)
    }

    async getRequirements(){
        
    }

    getProperties(){
        console.log(this.#configs)
    }
}

export = Controler