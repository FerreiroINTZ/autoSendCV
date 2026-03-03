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
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Controler_databaseConnection, _Controler_configs, _Controler_driver;
const ControlerConfigurator_1 = __importDefault(require("./ControlerConfigurator"));
class Controler {
    constructor(data) {
        _Controler_databaseConnection.set(this, void 0);
        _Controler_configs.set(this, void 0);
        _Controler_driver.set(this, void 0);
        // faz as verificacoes basicas
        ControlerConfigurator_1.default.basicVerificantionsOfUserConfigParam(data);
        __classPrivateFieldSet(this, _Controler_configs, ControlerConfigurator_1.default.transformUrlOnConfigProperty(data.userConfigs), "f");
        __classPrivateFieldSet(this, _Controler_databaseConnection, data.dbConn, "f");
        __classPrivateFieldSet(this, _Controler_driver, data.driver, "f");
    }
    getWebSite() {
        return __awaiter(this, void 0, void 0, function* () {
            yield __classPrivateFieldGet(this, _Controler_driver, "f").get(__classPrivateFieldGet(this, _Controler_configs, "f").url.href);
        });
    }
    getRequirements() {
        return __awaiter(this, void 0, void 0, function* () {
        });
    }
    getProperties() {
        console.log(__classPrivateFieldGet(this, _Controler_configs, "f"));
    }
}
_Controler_databaseConnection = new WeakMap(), _Controler_configs = new WeakMap(), _Controler_driver = new WeakMap();
module.exports = Controler;
//# sourceMappingURL=Controler.js.map