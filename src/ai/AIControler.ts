import fs, { read } from "fs"
import {GoogleGenAI} from "@google/genai"
import {
    DescriptionSchemaParsed,
    AiModels,
    modelsAvailable
} from "../types/types$schemas"
import Utils from "../utils/utils"

export default class AIControler{
    #ai: GoogleGenAI
    #maxTries = 10
    

    #ai_models: {name: AiModels, isUsable: boolean}[] = modelsAvailable.map((x: AiModels) => ({name: x, isUsable: true}))
    #current_ai_model: {nome: AiModels, indx: number} = {
        nome: this.#ai_models[0]!.name,
        indx: 0 // indice atual dos modelos
        // sera usado paa acessar os modelos no #ai_models
    }
    #isUsable = true

    constructor(aiKey: string){
        this.#ai = new GoogleGenAI({apiKey: aiKey})
        
        // precisa ser um async para dar certo!
        // this.testeAiAPI()   // nao ta funcionando
    }

    changeAiModel(
        descText: {jobId: string, description: string}[], 
        keyWords: string[], 
        otherInfos: string
    ): any{

        // invalida o modelo atual
        this.#ai_models[this.#current_ai_model.indx]!.isUsable = false

        // verifica se o modelo atual e o ultimo
        // pois, se for, ele invalida o uso da IA para a pesquisa
        // caso o modelo seja o ultimo e entrar aqui, e por que a cota dela foi esgotada, entao ele verifica se este e ultimo, e desabilita a IA
        if(this.#ai_models.length == this.#current_ai_model.indx + 1){
            // console.log("\x1b[32m inutilizavel! \x1b[0m")
            this.#isUsable = false
            return false
        }

        // busca o indice do proximo modelo usavel disponivel
        const currUsable = this.#ai_models.findIndex((element, index) =>{
            if(element.isUsable){
                return true
            }
        })

        // atribue o modelo atual como o elemento do indice achado
        this.#current_ai_model = {
            nome: this.#ai_models[currUsable]!.name,
            indx: currUsable
        }

        // tenta de novo
        console.log("modelo mudado!")
        this.#maxTries = 10
        return this.askAiForGetDescriptionDetais(descText, keyWords, otherInfos)
    }

    // teste se a chave da API e valida
    async testeAiAPI(){
        try{
            await this.#ai.models.list()
        }catch(err){
            throw new Error("Chave de API invalida!")
        }
    }

    // replica o comportamento da API
    async aiMockReturn(){
        const data = {
            salario: 0,
            area: "nenhuma",
            paridade: 3,
            justificativa: "slw",
            requisitos: ["valor 1", "valor 2"],
            matches: ["match 1", "match 2"],
            weaknesses: ["tudo", "nada"],
            summary: "sumarry",
            jobId: "0123456789"
        }
        return data
    }

    // retornar os dados, mas se a IA nao analisar retorna false, e fora daq ha uma validacao que nao permite a IA analisar mais as vagas
    async askAiForGetDescriptionDetais(
        descText: {jobId: string, description: string}[], 
        keyWords: string[],
        otherInfos: string): Promise<any>{
        
        // se nao for usavel ele retornar false
        if(!this.#isUsable){
            process.stdout.write("\n \x1b[32m IA indisponiel! \x1b[0m")
            return false
        }
        // console.log()

        const readPrompt: string  = fs.readFileSync("./src/ai/prompt").toString()
        const keywordsFormated = keyWords.join("; ")
        const promptFormated = readPrompt
            .replace(/\${keywords}/, keywordsFormated)
            .replace(/\${descText}/, JSON.stringify(descText)) + otherInfos
        
        // console.log("Prompt Formated")
        // console.log(promptFormated)
        try{

            if(this.#maxTries < 10) console.log("Pegando dados novamente!");
            const resp = await this.#ai.models.generateContent({
                model: this.#current_ai_model.nome,
                // melhorar o prompt
                contents: promptFormated,
                config: {
                    responseMimeType: "application/json",
                    responseJsonSchema: DescriptionSchemaParsed
                }
            })
            const json = JSON.parse(resp.text!)
            // console.log(resp)
            // console.log(json)
            return json
        }catch(e: any){
            const msg = JSON.parse(e.message).error.message
            console.log(msg)
            if(msg.includes("You exceeded")){
                console.log("tokens maximos atingidos para: ", this.#current_ai_model.nome)
                
                // nao retorna nada
                // apenas muda o modelo, ou define como nao usavel a IA
                const resp = this.changeAiModel(descText, keyWords, otherInfos)
                console.log("\x1b[31mCota exedida! \x1b[0m")
                if(typeof resp == "boolean"){
                    return false
                }

                return resp
                // if(!this.#isUsable){
                //     return false
                // }
            }
            if(msg.includes("high demand")){
                if(!this.#maxTries){
                    // muda o modelo, ao invez de parar o programa
                    const resp = this.changeAiModel(descText, keyWords, otherInfos)
                    return false
                }

                // colocar no utils
                await Utils.waitTime(10, "sec")

                this.#maxTries -= 1
                console.log("Tentativa: ", this.#maxTries)
                return this.askAiForGetDescriptionDetais(
                    descText, 
                    keyWords, 
                    otherInfos
                )
            }
            // se todas as cotas foram exedidas lanca um erro e quebra (para) a aplicacao
            throw new Error("Erro com a IA!")
            
            // colocar um log aqui que avisa que a cota foi exedida
            // fazer com que, ao execeder a cota, ele use outro modelo
            return {}
        }
    }
}