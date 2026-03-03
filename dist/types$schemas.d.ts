import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
export declare const ConfigSchema: z.ZodObject<{
    site: z.ZodEnum<{
        linkedin: "linkedin";
        indeed: "indeed";
        infojobs: "infojobs";
    }>;
    keywords: z.ZodArray<z.ZodString>;
    aiKey: z.ZodString;
    ai: z.ZodOptional<z.ZodCustom<GoogleGenAI, GoogleGenAI>>;
    url: z.ZodOptional<z.ZodCustom<URL, URL>>;
    area: z.ZodOptional<z.ZodString>;
    knowledge: z.ZodOptional<z.ZodArray<z.ZodString>>;
    cidade: z.ZodOptional<z.ZodString>;
}, z.core.$strict>;
export type Configuracao = z.infer<typeof ConfigSchema>;
//# sourceMappingURL=types$schemas.d.ts.map