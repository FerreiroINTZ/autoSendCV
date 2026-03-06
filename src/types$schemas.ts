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

export const UserConfigSchema = z.object({
    site: EnumSites,
    keywords: z.array(z.string()).min(1, "Pecisa de pelo menos 1 Item"),
    aiKey: z.string(),
    area: z.string().optional(),
    knowledge: z.array(z.string()).optional(),
    cidade: z.string().optional(),
}).strict()

export type UserConfig = z.infer<typeof UserConfigSchema>

// ============= configs do Controler

export const ConfigSchema = z.object({
    site: EnumSites,
    keywords: z.array(z.string()).min(1, "Pecisa de pelo menos 1 Item"),
    aiKey: z.string(),

    // sao obrigatorios
    ai: z.instanceof(GoogleGenAI).optional(),
    url: z.instanceof(URL).optional(),
    
    area: z.string().optional(),
    knowledge: z.array(z.string()).optional(),
    cidade: z.string().optional(),
}).strict()

export type Configuracao = z.infer<typeof ConfigSchema>


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
}

// ================ Descriptionn Schema

const DescriptionsSchema = z.object({
    salario: z.number().describe("o salario pago pela vaga"),
    requisitos: z.array(z.string()).describe("os requisitos que a vaga pede para nela"),
    area: z.string().describe("qual area a vaga faz parte, com base nas habilidades")
})

export const DescriptionSchemaParsed = z.toJSONSchema(DescriptionsSchema)