"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const genai_1 = require("@google/genai");
const types_schemas_1 = require("./types$schemas");
class ControlerConfigurator {
    static basicVerificantionsOfUserConfigParam({ userConfigs, dbConn, driver }) {
        if (typeof userConfigs != "object") {
            throw new Error("Configuracoes tem que ser um Objeto!");
        }
        if (typeof dbConn != "object") {
            throw new Error("Banco de dados invalido!");
        }
        if (!driver) {
            throw new Error("Driver invalido!");
        }
        const statement = types_schemas_1.ConfigSchema.safeParse(userConfigs);
        if (!statement.success) {
            // console.log(statement.error)
            throw new Error("Configuracoes invalidas");
        }
        try {
            const api_teste = new genai_1.GoogleGenAI({ apiKey: userConfigs.aiKey });
            this.testeAiAPI(api_teste);
        }
        catch (e) {
            throw new Error("Chave da API ivalida ou nnao autorizada!");
        }
    }
    // da pra, ao invez de definir cada apropriedade, retornar um objeto com tudo ja configurado em apenas um
    // configura a URL basica
    static transformUrlOnConfigProperty(configs) {
        const newObj = Object.assign({}, configs);
        newObj.url = new URL(this.sitesDefaultsConfigs(configs.site).host);
        newObj.url.pathname = this.sitesDefaultsConfigs(configs.site).pathname;
        newObj.url.search = this.sitesDefaultsConfigs(configs.site).search + configs.keywords[0];
        return Object.assign({}, newObj);
    }
    // configura a URL para cada opcao
    static sitesDefaultsConfigs(word) {
        const opts = {
            linkedin: {
                host: `https://${word}.com`,
                pathname: "jobs/search/",
                search: "keywords="
            },
            indeed: {
                host: `https://${word}.com`,
                pathname: "jobs",
                search: "q="
            },
            infojobs: {
                host: `https://${word}.com.br`,
                pathname: "empregos.aspx",
                search: "palabra="
            }
        };
        return opts[word];
    }
    // teste se a chave da API e valida
    static testeAiAPI(apiInstance) {
        return __awaiter(this, void 0, void 0, function* () {
            yield apiInstance.models.list();
        });
    }
}
exports.default = ControlerConfigurator;
//# sourceMappingURL=ControlerConfigurator.js.map