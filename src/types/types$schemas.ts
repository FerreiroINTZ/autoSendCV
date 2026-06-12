import {z} from "zod"
import {GoogleGenAI} from "@google/genai"

// isso cria um Enum
// isso precisa virar um tipo como um Enum, e nao um array
export const Sites = [
    'linkedin',
    'indeed',
    'infojobs'
] as const

export type ListaDeSites = typeof Sites[number]

const EnumSites = z.enum(Sites)

// ============= configs do usuario
// o schema que o usuario vai prencher

// precisa unificar os "UserConfigSchema" com o "ConfigSchema"
// da pra fazer isso com UserConfigSchema.extends({...})
export const UserConfigSchema = z.object({
    site: EnumSites,
    searchWords: z.array(z.string()).min(1, "Precisa de pelo menos 1 item"),
    aiKey: z.string(),
    paginas: z.number().default(1).optional(),
    
    area: z.string().optional(),
    keywords: z.array(z.string()).optional(),
    knowledge: z.array(z.string()).optional(),
    cidade: z.string().optional(),
    aiRequired: z.boolean().optional(),
    minQtdToAnalise: z.number().optional().default(10),

    otherAiCriterions: z.string().optional(),
    soundsEnabled: z.boolean().optional().default(false)
    // sao informacoes adicionais personalizadas que seram passadas para a IA usar como cireteio
}).strict()

export type UserConfig = z.infer<typeof UserConfigSchema>

// ============= configs do Controler
// o shcema que a Classe do "Controller" ira usar

export const ConfigSchema = z.object({
    site: EnumSites,
    searchWords: z.array(z.string()).min(1, "Precisa de pelo menos 1 item"),
    aiKey: z.string(),
    
    // tem que ser opicional pra nao conflitar com o UserSchema na verificacao de URL do ControllerConfigurator
    ai: z.instanceof(GoogleGenAI).optional(),
    url: z.instanceof(URL).optional(),
    
    paginas: z.number().default(1).optional(),
    keywords: z.array(z.string()).optional(),
    area: z.string().optional(),
    knowledge: z.array(z.string()).optional(),
    cidade: z.string().optional(),
    minQtdToAnalise: z.number().optional().default(10),
    
    // se a analise da IA deve se robrigatoria
    aiRequired: z.boolean().optional(),
    otherAiCriterions: z.string().optional(),
    soundsEnabled: z.boolean().optional().default(false)
}).strict()

export type Configuracao = z.infer<typeof ConfigSchema>

const slw = z.object({
    name: z.string(),
    ...z.object(ConfigSchema)
})

type SiteDefaultConfigs = {
    host: string,
    pathname: string,
    search: string
}

export type Elements = {
    lista: string,
    singleVacancy: string,
    title: string,
    empresa: string,
    regiao: string,
    vacancyDescriptionTag: string,
    publishDate: string,
    pagingTag: (site: string) => string
}

// ================ Description Schema =================
// schema que a IA usara como base para prencher
const DescriptionsSchema = z.object({
    salario: z.number().optional().describe('o salario pago pela vaga (se nao tiver deixe uma string vazia "")'),
    area: z.string().describe("qual area a vaga faz parte, com base nas habilidades"),
    
    paridade: z.number().min(1).max(4).describe("um numero de 1 ate 4 que representa o quanto a vaga condiz com as palavras chave citadas no prompt. Sendo: 1, pessimo; 2, ruim; 3, bom; 4, perfeita "),
    justificativa: z.string().describe("justificativa do por que escolhido o valor da paridade"),
    requisitos: z.array(z.string()).describe("os requisitos que a vaga pede"),
    matches: z.array(z.string()).describe("contem as palavras chave da vaga, em si"),
    weaknesses: z.array(z.string()).describe("sao os pontos fracos da vaga com relacao as palavras chave que o usuario passou"),
    summary: z.string().describe("um resumo de poucas palavras sobre a paridade da vaga"),
    
    jobId: z.string().describe("Coloque aqui o jobId da vaga analisada")
})

const descriptionArraySchema = z.array(DescriptionsSchema)

export const DescriptionSchemaParsed = z.toJSONSchema(descriptionArraySchema)

// ============================ ai types 

export const modelsAvailable = [
    "gemini-3-flash-preview",
    "gemini-2.5-flash"
    // "Gemini 2.5 Flash", 
    // "Gemini 3.1 Flash Lite"
] as const

const aiModelsSchema = z.enum(modelsAvailable)

export type AiModels = z.infer<typeof aiModelsSchema>