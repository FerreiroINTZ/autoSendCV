import { z } from "zod";
import { GoogleGenAI } from "@google/genai";
import { WebDriver } from "selenium-webdriver/lib/webdriver";
import {exec, execSync} from "child_process"

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

const modosDeAudio = ["end", "error", "save"] as const

type Modes = typeof modosDeAudio[number]

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

  getUnavailableTagOnLinkedin() {
    const tag = document.getElementsByClassName("t-14");
    let tags: any = [...tag];
    const divs = tags.filter((x: Element) => {
      if (x.tagName == "DIV" && x.classList.length == 1) {
          return true;
        }
      })[0]
      const spans = [...divs.querySelectorAll("span")]
      const span = spans.filter((x: HTMLSpanElement) => {
        console.log(x.innerText)
        if (x.innerText.includes("aceita mais")) {
          return true
        }
      });
      return span
  }

  // verifica as vagas existetes para ver se tao disponiveis
  async verifyVacancies(order: string = "desc") {
    const vacanciesIds = await this.modules.db.getVacanciesToVerify(
      this.#configs.paginas,
    );

    if(!vacanciesIds.length){
      console.log("\x1b[33mNao ha vagas para serem analisadas! \x1b[0m")
      return
    }

    let vagasIndisponiveis: string[] = [];
    // return
    for await (const vaga of [...Array(vacanciesIds.length).keys()]) {
      const vacancy = vacanciesIds[vaga];
      process.stdout.write(`${vaga + 1}/${vacanciesIds.length}: ${vacancy.jobid} `);
      // console.log(vacancy)

      await this.#driver.get(vacanciesIds[vaga].link);
      try {
        let stringFunc = this.getUnavailableTagOnLinkedin.toString()
        stringFunc = `
          let func = function ${stringFunc}
          return func()  
        `

        const slw: any = await this.#driver.executeScript(stringFunc)
        if(!slw.length){
          throw new Error("Vaga encontrada encontrada")
        }
        vagasIndisponiveis.push(vacancy.jobid);
        console.log("\x1b[31mVaga indisponivel! \x1b[0m");
      } catch (e: any) {
        // console.log(e)
        // console.log(Object.keys(e))
        // console.log(e.name)
        console.log("\x1b[32m Vaga Disponivel! \x1b[0m");
      }
    }
    console.log(vagasIndisponiveis);
    console.log("\n")
    console.log(vagasIndisponiveis)
    console.log(`\x1b[31mVagas Indisponiveis:\x1b[0m ${vagasIndisponiveis.length}`)
    console.log(`\x1b[32mVagas Disponiveis:\x1b[0m ${vacanciesIds.length - vagasIndisponiveis.length}`)
    await this.modules.db.changeDisponibilidade({toSave: vagasIndisponiveis, all: vacanciesIds.map((x: any) => x.jobid)});
    this.playAudios("end")
  }

  // colocar no Utils
  playAudios(mode: Modes){
    // if(!this.#configs.soundsEnabled){
    //   return;
    // }
    if(mode == "end"){
      execSync("play /usr/share/sounds/freedesktop/stereo/alarm-clock-elapsed.oga vol 1 reverb speed .4 vol 1")
    }if(mode == "error"){
      execSync("play --volume .1 /usr/share/sounds/freedesktop/stereo/suspend-error.oga speed .5 reverb")
    }
    if(mode == "save"){
      execSync("play /usr/share/sounds/freedesktop/stereo/service-login.oga speed .8 reverb")
    }
  }

  // teste
  async startTogetVacaciesV2(){
    let vagas = []
    let bucketsWisheds = 5
    for(let i in [...Array(bucketsWisheds)]){
      console.log(i)
    }
  }


  async pageNavigation(pagina: number){
    let url: URL | string = await this.#driver.getCurrentUrl();
        url = new URL(url);
        url.searchParams.set("start", `${pagina * 25}`);
        url = url.toString();
        await this.#driver.get(url);
  }

  // new name: "start_to_get_vacancies"
  // pega as vagas com base nas configs
  async startToGetVacancies() {
    let vacanciesListDatas = []; // contera os dados das vagas pegas
    const descriptions: { jobId: string; descricao: string }[] = []; // somente a descricao da vaga
    // teve que ser separado de "vacanciesListDatas" para facilitar seu uso com a IA.

    for await (const pagina of [...Array(this.#configs.paginas).keys()]) {
      if (pagina > 0) {
        await this.pageNavigation(pagina)
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
      let qtdVagasPegas = 1; // serve para mostrar os numeros de vagas pegas
      const p = async () =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve("resolvido");
          }, 3000);
        });

      for await (const item of elements) {

        // da pra ir pro controller de UI (UI do terminal), ue futuramente existira
        // lista quantos ja foram em comparacao aos que faltam
        console.log(`Pagina: ${pagina + 1}/${this.#configs.paginas}`);
        process.stdout.write(
          `Vaga: ${String(qtdVagasPegas).padStart(2, "0")}/${elements.length}`,
        );
        qtdVagasPegas++;

        // scrolla ate o elemento atual
        await this.#driver.executeScript("arguments[0].scrollIntoView()", item);
        await item.click();
        const mainElementsTag = await item.findElements(
          By.css(
            ":scope > div > div > div:nth-child(1) > div:nth-child(1) > div:nth-child(2) > div",
          ),
        );

        // separar em outro metodo (verify on Data Base)
        // para isso sera preciso instancias o "DatabaseControler" tambem
        // (pendencia futura)
        const currentUrl = await this.#driver.getCurrentUrl();
        const url = new URL(currentUrl).searchParams;
        const jobId = url.get("currentJobId");
        const existance: Boolean = await this.modules.db.verifyExistance(jobId);

        // se o titulo ja existir passa pro proximo
        if (existance) {
          console.log("\x1b[33m Ja existe essa vaga! \x1b[0m \n");
          console.log(`Qtd Minima: \x1b[34m${vacanciesListDatas.length}/${this.#configs.minQtdToAnalise} \x1b[0m`)
          continue;
        } else {
          console.log("\x1b[32m Vaga Nova! \x1b[0m");
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
        vacanciesListDatas.push(dadosGerais);
        console.log(`Qtd Minima: \x1b[34m${vacanciesListDatas.length}/${this.#configs.minQtdToAnalise} \x1b[0m`)
        console.log("\n");
      }

      // ============ fora do loop da pagina ==================
        console.log("\x1b[2J \x1b[0;0H")
        console.log(descriptions.length)
        
        // se nessa pagina tiver alguma vaga pega ele analisa
        if (vacanciesListDatas.length > this.#configs.minQtdToAnalise) {

        console.log("Tamanho Total da String: ", descriptions.toString().length)
        console.log("Tokens totais: ", descriptions.toString().length/4)
        
        console.log("Ia analisando ✨...");
        const resp = await this.modules.ai.askAiForGetDescriptionDetais(
          descriptions,
          this.#configs.keywords,
          this.#configs.otherAiCriterions,
        );

        // se as cotas foram exedidas para o codigo
        if (resp == false) {
          this.playAudios("error")
          console.log("\x1b[1;31mTodas as cotas foram exedidas! \x1b0m");
          return;
        }

        console.log("\x1b[2J \x1b[0;0H")

        // colocar no Utils
        // isso junta a resposta da IA com os outros dados pegos
        const finalData = vacanciesListDatas.map((x) => {
          
          // pega a analise da IA correpondente ao do map atual
          const respectiveAiAnalysis = resp.filter(
            (y: any) => x.jobid == y.jobId,
          )[0];
          // pega a descricao correpondente ao do map atual
          const respectiveDescription = descriptions.filter(
            (h) => x.jobid == h.jobId,
          )[0];

          // trata os dados pegos
          if(respectiveAiAnalysis?.salario == undefined || respectiveAiAnalysis?.salario == null){
            console.log(respectiveAiAnalysis)
            console.log("Debug Salario")
            console.log("\x1b[1;31m Salario invalido! \x1b[0m", respectiveAiAnalysis?.salario)
          }
          return {
            ...x,
            salario: respectiveAiAnalysis?.salario
            ? `${respectiveAiAnalysis?.salario}`
            : "",
            ...respectiveAiAnalysis,
            descricao: respectiveDescription!.descricao,
          };
        });
        console.log("Salvando no Banco 🌐...");
        await this.modules.db.saveVacancyOnDataBase(
          finalData,
        );
        vacanciesListDatas = []
        this.playAudios("save")
      }
    }
    console.log("\x1b[1;35mTerminou!");
    this.playAudios("end")
  }

  getProperties() {
    console.log(this.#driver);
  }
}

export = Controler;
