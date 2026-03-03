import { GoogleGenAI } from "@google/genai";
declare class ControlerConfigurator {
    static basicVerificantionsOfUserConfigParam({ userConfigs, dbConn, driver }: {
        userConfigs: any;
        dbConn: any;
        driver: any;
    }): void;
    static transformUrlOnConfigProperty(configs: any): any;
    static sitesDefaultsConfigs(word: string): any;
    static testeAiAPI(apiInstance: GoogleGenAI): Promise<void>;
}
export default ControlerConfigurator;
//# sourceMappingURL=ControlerConfigurator.d.ts.map