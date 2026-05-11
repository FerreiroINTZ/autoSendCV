import { Pool } from "pg";
import {PrismaClient} from "../generated/prisma/client"
import {PrismaPg} from "@prisma/adapter-pg"

export default class DatabaseControler {
  #conn: PrismaClient;
  // recebe o id da vaga atual
  private currentVacancyId: string = "";

  // se conecta via String de conexao
  constructor(connString: any) {
    const adapter = new PrismaPg({connectionString: connString})
    const db = new PrismaClient({adapter})
    this.#conn = db
    // precisa ser asincrono para funcionar
    this.testeDb();
  }

  async testeDb() {
    try {
      const data = await this.#conn.$executeRaw`SELECT NOW();`
    } catch (err) {
      throw new Error("Problema com o Banco de Dados!");
    }
  }

  async verifyExistance(jobId: string) {
    const data = await this.#conn.vagas.findMany({
      where: {
        jobid: jobId
      }
    })

    if (data.length) {
      return true;
    } else {
      {
        return false;
      }
    }
  }

  // transformar em uma transaction
  // para deixar de gerenciar diretamente as descricoes
  async saveVacancyOnDataBase(
    generalData: any[],
    // aiData: any[],
    // descriptions: any[]
  ) {
    try {
      console.log(Object.keys(generalData))
      const query = await this.#conn.$transaction(async tx =>{
        for await(let singleData of generalData){
          await tx.vagas.create({
          data:{
            titulo: singleData.titulo,
            empresa: singleData.empresa,
            cidade: singleData.cidade,
            keywords: singleData.keywords,
            plataforma: singleData.plataforma,
            jobid: singleData.jobid,
            link: singleData.link,
            modalidade: singleData.modalidade,
            dt_publicacao: singleData.dt_publicacao,
            area: singleData?.area,
            salario: String(singleData?.salario),
            descricoes: {
              create: {
                descricao: singleData.descricao,
              }
            },
            ai_analysis: {
              create: {
                paridade: singleData?.paridade,
                justificativa: singleData?.justificativa,
                matches: singleData?.matches,
                requisitos: singleData?.requisitos,
                summary: singleData?.summary,
                weaknesses: singleData?.weaknesses
              }
            }
          }
        })
        }
        
    });
      // console.log("\x1b[32m Salvo no Banco! \x1b[0m ", `${data.paridade ? data.paridade : 0}/4`);
    } catch (e) {
      console.log(e);
      // se falhar ele apaga a descricao, pra ela nao ficar sozinha
      console.log("\x1b[31m Erro ao salvar no Banco! \x1b[0m");
      // throw e
    }
  }

  saveDescription() {}
}
