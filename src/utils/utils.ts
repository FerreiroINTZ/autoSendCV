import {
  Elements
} from "../types/types$schemas"

import {until, By} from "selenium-webdriver"

export default class ControlerUtils {

  #driver: any
  #elements: Elements

  constructor({driver, elements}: {driver: any, elements: Elements}){
    this.#elements = elements
    this.#driver = driver
  }

  // pega a data da publicacao e transforma em DateTime
  async getANDTranformPublishedDate(): Promise<Date | null> {
    function transformaTimeInDays(number: number, time: string) {
      let newTime = time;

      // se o numero for mais q 1 ele sera plural
      // entao devemos padronizar para o sinngular
      if (number > 1) {
        let qtd_slice = 1;
        if (time == "meses") {
          qtd_slice = 2;
        }
        newTime = newTime.slice(0, newTime.length - qtd_slice);
      }

      let qtd_dias;

      switch (newTime) {
        case "dia":
          qtd_dias = number;
          break;
        case "semana":
          qtd_dias = number * 7;
          break;
        case "mes":
          qtd_dias = number * 30;
          break;
        default:
          qtd_dias = 0;
      }

      const currentDate = new Date();
      const pastDate = new Date(
        currentDate.setDate(currentDate.getDate() - Number(qtd_dias)),
      );
      newTime = `${pastDate.getFullYear()}-${pastDate.getMonth() + 1}-${pastDate.getDate()}`;

      return newTime;
    }

    try {
      const span = await this.#driver.wait(
        until.elementLocated(By.xpath(this.#elements.publishDate)),
        5000,
      );
      const allSpanText = await span.getText();
      // console.log(`\x1b[32m ${allSpanText} \x1b[30m`)
      const { groups } = allSpanText.match(/há (?<number>\d+) (?<word>\w+)/);
      const text = groups.word;
      const { number } = groups;

      const published_date = new Date(transformaTimeInDays(number, text));
      return published_date;
    } catch (e) {
      return null;
    }
  }

  // pega o texto da descricao
  async getDescriptionsInfos(){

    // colocar um wait para a tag ul, aqui
    const descriptionTag = this.#driver.findElement(By.xpath(this.#elements.vacancyDescriptionTag))
    const descText = await descriptionTag.getText()
    const requisitos: string[] = []

    return descText
  }

  static async waitTime(time: number, mode: "sec" | "mili", showProgress: boolean = false){
    const timeMultiplier = mode == "sec" ? 1000 : 100
    let currentSecond = 1
    const period = setInterval(() =>{
      if(showProgress){
        process.stdout.write(`\x1b[34m${currentSecond} \x1b[0m`)
        currentSecond++
      }
    }, 1000)

    const waitFunc = async () => new Promise((resolve) =>
      setTimeout(() =>{
        resolve("")
        clearInterval(period)
      }, time * timeMultiplier)
    )
    await waitFunc()
  }
}
