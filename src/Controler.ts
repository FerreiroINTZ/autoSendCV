import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { WebDriver } from "selenium-webdriver/lib/webdriver";

import Configurator from "./configurator/configurator";
import DataBaseContoler from "./db/DatabaseControler";
import AIControler from "./ai/AIControler";
import Utils from "./utils/utils";

import {
  ConfigSchema,
  Configuracao,
  Elements,
  DescriptionSchemaParsed,
} from "./types/types$schemas";

import { By, until, Key } from "selenium-webdriver";

function composition(...clases: any[]) {
  const Clases = [];
  for (let y = 0; y < clases.length; y++) {}
}

class Controler extends Configurator {
  #driver: WebDriver;
  #elements: Elements;
  #configs: Configuracao;

  constructor(data: { dbConn: any; userConfigs: Configuracao; driver: any }) {
    // faz as verificacoes basicas
    Configurator.basicVerificantionsOfUserConfigParam(data);

    // seta as propriedades da classe Utils
    const elements = Configurator.setElementsTag(data.userConfigs.site);
    super({
      db: {
        class: DataBaseContoler,
        data: data.dbConn,
      },
      ai: {
        class: AIControler,
        data: data.userConfigs.aiKey,
      },
      utils: {
        class: Utils,
        data: { elements, driver: data.driver },
      },
    });

    // instacia os outros valores
    this.#configs = Configurator.parseConfigs(data.userConfigs);
    this.#configs.paginas = data.userConfigs.paginas || 1;
    this.#driver = data.driver;
    this.#elements = elements;
  }

  // acessa o site
  async getWebSite() {
    await this.#driver.manage().window().setRect({ width: 1000, height: 700 });
    await this.#driver.get(this.#configs.url!.href);
    console.log(this.#configs.url!.href);
    this.#driver.sleep(6000);
    // await this.doResearch()
  }

  // new name: "start_to_get_vacancies"
  async startToGetVacancies() {

    for await (const pagina of [...Array(this.#configs.paginas).keys()]) {
      if (pagina > 0) {
        let url: URL | string = await this.#driver.getCurrentUrl();
        url = new URL(url);
        url.searchParams.set("start", `${pagina * 25}`);
        url = url.toString();
        console.log(url);
        await this.#driver.get(url);
        console.log("continua");
      }

    // pega a lista <ul>
    const lista = await this.#driver.wait(
      until.elementLocated(By.xpath(this.#elements.lista)),
      20 * 1000,
    );

    // <li>s
    const elements = await lista.findElements(By.css(":scope > *"));
    console.log("pegou a lista");
    console.log(elements.length);
    // return null
    let qtd = 1;
    const p = async () =>
      new Promise((resolve) => {
        setTimeout(() => {
          resolve("resolvido");
        }, 3000);
      });


    
      const datas = [];
      const descriptions: { jobId: string; descricao: string }[] = [];

      for await (const item of elements) {
        // lista quantos ja foram em comparacao aos que faltam
        console.log(
          `Pagina: ${pagina + 1}/${this.#configs.paginas}`,
        );
        process.stdout.write(`Vaga: ${String(qtd).padStart(2, "0")}/${elements.length}`)
        qtd++;

        // scrolla ate o elemento atual
        await this.#driver.executeScript("arguments[0].scrollIntoView()", item);
        await item.click();
        const mainElementsTag = await item.findElements(
          By.css(
            ":scope > div > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div",
          ),
        );

        //     // separar em outro metodo (verify on Data Base)
        //     // para isso sera preciso instancias o "DatabaseControler" tambem
        //     // (pendencia futura)
        const currentUrl = await this.#driver.getCurrentUrl();
        const url = new URL(currentUrl).searchParams;
        const jobId = url.get("currentJobId");
        const existance: Boolean = await this.modules.db.verifyExistance(jobId);

        // se o titulo ja existir passa pro proximo
        if (existance) {
          console.log("\x1b[33m Ja existe essa vaga! \x1b[0m \n");
          continue;
        }

        let title = await mainElementsTag[0]!.getText();
        title = title.split("\n")[0]!;
        const empresa = await mainElementsTag[1]!.getText();
        const regiao = await mainElementsTag[2]!.getText();
        let macthModalidade: any = regiao.match(
          /\((?<modalidade>[a-zA-ZÀ-ú]+)\)$/,
        );

        // se o REGEX der certo ele pega o valor do grupo
        if (macthModalidade) {
          macthModalidade = macthModalidade.groups.modalidade;
        }
        const dt_publicado =
          await this.modules.utils.getANDTranformPublishedDate();
        // pega a descricao, e os requisitos com IA
        const descricao = await this.modules.utils.getDescriptionsInfos();

        const dadosGerais = {
          jobid: jobId, // serra usado para colocar a descricao no respectivo lugar
          titulo: title,
          empresa,
          cidade: regiao,
          keywords: this.#configs.keywords,
          plataforma: this.#configs.site,
          link: currentUrl,
          modalidade: macthModalidade,
          dt_publicacao: dt_publicado,
        };
        descriptions.push({ jobId: String(jobId), descricao });
        datas.push(dadosGerais);
        console.log("\n");

        continue;

        const aiResponse = await this.modules.ai.askAiForGetDescriptionDetais(
          descricao,
          this.#configs.keywords,
          this.#configs.otherAiCriterions,
        );
        // criar um tipo para os dados recebidos, e verificar com o zod
        // verificacao

        // o return acaba com o loop e com a funcao
        if (!aiResponse && this.#configs.aiRequired) {
          console.log("\x1b[31m IA Indisponivel!");
          return null;
        }

        if (aiResponse) {
          console.log("IA Fora de alcance!");
        }

        const data: any = {
          title,
          empresa,
          regiao,
          descricao,
          keywords: this.#configs.keywords,
          site: this.#configs.site,
          jobId,
          currentUrl,
          macthModalidade,
          dt_publicado,
          salario: aiResponse?.salario,
          area: aiResponse?.area,

          ...aiResponse,

          // paridade: aiResponse?.paridade,
          // justificativa: aiResponse?.justificativa,
          // requisitos: aiResponse?.requisitos,
          // matches: aiResponse?.matches,
          // summary: aiResponse?.sumarry,
          // weaknesses: aiResponse?.weaknesses,
        };
        // salva no banco
        await this.modules.db.saveVacancyOnDataBase(data);
      }

      // se nessa paginna tiver alguma vaga pega ele analisa
      if(descriptions.length){

          console.log("Ia analisando ✨...");
          const resp = await this.modules.ai.askAiForGetDescriptionDetais(
        descriptions,
        this.#configs.keywords,
        this.#configs.otherAiCriterions,
      );
      if (resp == false) {
        console.error("Erro ao analisar com a IA");
        return;
      }

      const finalData = datas.map((x) => {
        const respectiveAiAnalysis = resp.filter(
            (y: any) => x.jobid == y.jobId,
        )[0];
        const respectiveDescription = descriptions.filter(
            (h) => x.jobid == h.jobId,
        )[0];
        
        return {
            ...x,
            salario: String(respectiveAiAnalysis.salario),
            ...respectiveAiAnalysis,
            descricao: respectiveDescription!.descricao,
        };
    });
    // const aiFormated = resp.map((x: any) =>{
        //     delete x.area
        //     delete x.salario
        //     const newAIData = {...x, }
        //     return x
      // })
      console.log("Salvando no Banco 🌐...");
      await this.modules.db.saveVacancyOnDataBase(
          finalData,
          // aiFormated,
          // descriptions
        );
    }
    }
    console.log("\x1b[1;35mTerminou!");
  }

  getProperties() {
    console.log(this.#driver);
  }
}

export = Controler;
