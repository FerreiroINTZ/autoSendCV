import fs, { read } from "fs"
import {GoogleGenAI} from "@google/genai"
import {
    DescriptionSchemaParsed,
    AiModels,
    modelsAvailable
} from "../types/types$schemas"
export default class AIControler{
    #ai: GoogleGenAI

    #ai_models: {name: AiModels, isUsable: boolean}[] = modelsAvailable.map((x: AiModels) => ({name: x, isUsable: true}))
    #current_ai_model: {nome: AiModels, indx: number} = {
        nome: this.#ai_models[0]!.name,
        indx: 0
    }
    #isUsable = true

    constructor(aiKey: string){
        this.#ai = new GoogleGenAI({apiKey: aiKey})
        
        // precisa ser um async para dar certo!
        // this.testeAiAPI()   // nao ta funcionando
    }

    changeAiModel(
        descText: string, 
        keyWords: string[], 
        otherInfos: string
    ): void{

        // invalida o modelo atual
        this.#ai_models[this.#current_ai_model.indx]!.isUsable = false

        // verifica se o modelo atual e o ultimo
        // pois, se for, ele invalida o uso da IA para a pesquisa
        if(this.#ai_models.length == this.#current_ai_model.indx + 1){
            // console.log("\x1b[32m inutilizavel! \x1b[0m")
            this.#isUsable = false
            return 
        }

        // busca o proximo modelo usavel disponivel
        const currUsable = this.#ai_models.findIndex((element, index) =>{
            if(element.isUsable){
                return true
            }
        })
        
        
        // console.log(this.#ai_models[currUsable])
        // console.log(currUsable)
        // console.log(this.#current_ai_model)
        // console.log(this.#ai_models)

        this.#current_ai_model = {
            nome: this.#ai_models[currUsable]!.name,
            indx: currUsable
        }

        // console.log("Curr Index")
        // console.log(currUsable)
        // console.log(this.#ai_models.length == this.#current_ai_model.indx + 1)

        // console.log(currUsable)
        // console.log("Current Model: ")
        // console.log(this.#current_ai_model.nome)

        // console.log("Modelo novo: ")

        // tenta de novo
        console.log("modelo mudado!")
        this.askAiForGetDescriptionDetais(descText, keyWords, otherInfos)
    }

    // teste se a chave da API e valida
    async testeAiAPI(){
        try{
            await this.#ai.models.list()
        }catch(err){
            throw new Error("Chave de API invalida!")
        }
    }

    // retornar os dados, mas se a IA nao analisar retorna false, e fora daq ha uma validacao que nao permite a IA analisar mais as vagas
    async askAiForGetDescriptionDetais(
        descText: {jobId: string, desciption: string}[], 
        keyWords: string[],
        otherInfos: string){
        
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
            return false
            if(msg.includes("You exceeded")){
                console.log("tokens maximos atingidos para: ", this.#current_ai_model.nome)
                
                // nao retorna nada
                // apenas muda o modelo, ou define como nao usavel a IA
                this.changeAiModel(descText, keyWords, otherInfos)
                console.log(msg)
                if(!this.#isUsable){
                    return false
                }
            }
            
            // colocar um log aqui que avisa que a cota foi exedida
            // fazer com que, ao execeder a cota, ele use outro modelo
            return {}
        }
    }
}