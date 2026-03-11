"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DescriptionSchemaParsed = exports.ConfigSchema = exports.UserConfigSchema = exports.Sites = void 0;
const zod_1 = require("zod");
const genai_1 = require("@google/genai");
// isso cria um Enum
// isso precisa virar um tipo como um Enum, e nao um array
exports.Sites = [
    'linkedin',
    'indeed',
    'infojobs'
];
const EnumSites = zod_1.z.enum(exports.Sites);
// ============= configs do usuario
exports.UserConfigSchema = zod_1.z.object({
    site: EnumSites,
    searchWords: zod_1.z.array(zod_1.z.string()).min(1, "Precisa de pelo menos 1 item"),
    aiKey: zod_1.z.string(),
    paginas: zod_1.z.number().default(1).optional(),
    area: zod_1.z.string().optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    knowledge: zod_1.z.array(zod_1.z.string()).optional(),
    cidade: zod_1.z.string().optional(),
}).strict();
// ============= configs do Controler
exports.ConfigSchema = zod_1.z.object({
    site: EnumSites,
    searchWords: zod_1.z.array(zod_1.z.string()).min(1, "Precisa de pelo menos 1 item"),
    aiKey: zod_1.z.string(),
    // sao obrigatorios
    ai: zod_1.z.instanceof(genai_1.GoogleGenAI).optional(),
    url: zod_1.z.instanceof(URL).optional(),
    paginas: zod_1.z.number().default(1).optional(),
    keywords: zod_1.z.array(zod_1.z.string()).optional(),
    area: zod_1.z.string().optional(),
    knowledge: zod_1.z.array(zod_1.z.string()).optional(),
    cidade: zod_1.z.string().optional(),
}).strict();
// ================ Descriptionn Schema
const DescriptionsSchema = zod_1.z.object({
    salario: zod_1.z.number().describe("o salario pago pela vaga"),
    requisitos: zod_1.z.array(zod_1.z.string()).describe("os requisitos que a vaga pede para nela"),
    area: zod_1.z.string().describe("qual area a vaga faz parte, com base nas habilidades")
});
exports.DescriptionSchemaParsed = zod_1.z.toJSONSchema(DescriptionsSchema);
//# sourceMappingURL=types$schemas.js.map