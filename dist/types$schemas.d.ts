import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
export declare const Sites: readonly ["linkedin", "indeed", "infojobs"];
export type ListaDeSites = typeof Sites[number];
export declare const UserConfigSchema: z.ZodObject<{
    site: z.ZodEnum<{
        linkedin: "linkedin";
        indeed: "indeed";
        infojobs: "infojobs";
    }>;
    searchWords: z.ZodArray<z.ZodString>;
    aiKey: z.ZodString;
    paginas: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    area: z.ZodOptional<z.ZodString>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
    knowledge: z.ZodOptional<z.ZodArray<z.ZodString>>;
    cidade: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type UserConfig = z.infer<typeof UserConfigSchema>;
export declare const ConfigSchema: z.ZodObject<{
    site: z.ZodEnum<{
        linkedin: "linkedin";
        indeed: "indeed";
        infojobs: "infojobs";
    }>;
    searchWords: z.ZodArray<z.ZodString>;
    aiKey: z.ZodString;
    ai: z.ZodOptional<z.ZodCustom<GoogleGenAI, GoogleGenAI>>;
    url: z.ZodOptional<z.ZodCustom<URL, URL>>;
    paginas: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    keywords: z.ZodOptional<z.ZodArray<z.ZodString>>;
    area: z.ZodOptional<z.ZodString>;
    knowledge: z.ZodOptional<z.ZodArray<z.ZodString>>;
    cidade: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type Configuracao = z.infer<typeof ConfigSchema>;
export type Elements = {
    lista: string;
    singleVacancy: string;
    title: string;
    empresa: string;
    regiao: string;
    vacancyDescriptionTag: string;
    publishDate: string;
};
export declare const DescriptionSchemaParsed: z.core.ZodStandardJSONSchemaPayload<z.ZodObject<{
    salario: z.ZodNumber;
    requisitos: z.ZodArray<z.ZodString>;
    area: z.ZodString;
}, z.core.$strip>>;
//# sourceMappingURL=types$schemas.d.ts.map