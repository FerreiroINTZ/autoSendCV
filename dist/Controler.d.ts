import Utils from "./utils/utils";
import { Configuracao } from "./types/types$schemas";
declare class Controler extends Utils {
    #private;
    constructor(data: {
        dbConn: any;
        userConfigs: Configuracao;
        driver: any;
    });
    getWebSite(): Promise<void>;
    askAiForGetDescriptionDetais(descText: string): Promise<void>;
    startToGetVacancies(): Promise<void>;
    saveVacancyOnDataBase(data: any): Promise<void>;
    getProperties(): void;
}
export = Controler;
//# sourceMappingURL=Controler.d.ts.map