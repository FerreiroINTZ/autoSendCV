import { Configuracao } from "./types$schemas";
declare class Controler {
    #private;
    constructor(data: {
        dbConn: any;
        userConfigs: Configuracao;
        driver: any;
    });
    getWebSite(): Promise<void>;
    doResearch(): Promise<void>;
    askAiForGetDescriptionDetais(descText: string): Promise<void>;
    getDescriptionsInfos(): Promise<any[]>;
    getANDTranformPublishedDate(): Promise<Date | null>;
    getBasicInfos(): Promise<void>;
    saveVacancyOnDataBase(data: any): Promise<void>;
    getProperties(): void;
}
export = Controler;
//# sourceMappingURL=Controler.d.ts.map