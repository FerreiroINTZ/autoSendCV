import { GoogleGenAI } from "@google/genai";
import { Configuracao, UserConfig } from "./types$schemas";
declare class ControlerConfigurator {
    static basicVerificantionsOfUserConfigParam({ userConfigs, dbConn, driver }: {
        userConfigs: UserConfig;
        dbConn: any;
        driver: any;
    }): void;
    static transformUrlOnConfigProperty(configs: Configuracao): {
        site: "linkedin" | "indeed" | "infojobs";
        searchWords: string[];
        aiKey: string;
        ai?: GoogleGenAI | undefined;
        url?: URL | undefined;
        keywords?: string[] | undefined;
        area?: string | undefined;
        knowledge?: string[] | undefined;
        cidade?: string | undefined;
    };
    static sitesDefaultsConfigs(word: string): any;
    static testeAiAPI(apiInstance: GoogleGenAI): Promise<void>;
    static instantiateGoogleGenAI(apiKey: string): GoogleGenAI;
    static parseConfigs(userData: UserConfig): {
        site: "linkedin" | "indeed" | "infojobs";
        searchWords: string[];
        aiKey: string;
        ai?: GoogleGenAI | undefined;
        url?: URL | undefined;
        keywords?: string[] | undefined;
        area?: string | undefined;
        knowledge?: string[] | undefined;
        cidade?: string | undefined;
    };
    static setElementsTag(site: string): any;
}
export default ControlerConfigurator;
//# sourceMappingURL=ControlerConfigurator.d.ts.map