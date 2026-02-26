class Controler{
    #databaseConection;
    #configs;
    #chaves = ["site", "keywords", "area", "knowledge", "cidade"]
    // site
    // keywords
    // area
    // knowledge
    // cidade

    constructor(dbConn, configs){
        if(typeof configs == "object"){
            this.#configs = configs

            if(typeof dbConn == "object"){
                this.#databaseConection = dbConn
            }else{
                throw new Error("Banco invalido!")
            }
        }else{
            throw new Error("Configuracoes invalidas!")
        }
    }

}

module.exports = Controler