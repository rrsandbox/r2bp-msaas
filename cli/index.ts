import { Command } from "commander";

const program = new Command();

program
  .name("r2bp-cli")
  .description("CLI administrativa do boilerplate microsaaS")
  .version("0.1.0");

program
  .command("create-master-user")
  .description("Placeholder para criacao do usuario mestre")
  .action(() => {
    console.log("Comando preparado. A implementacao sera conectada ao modulo auth.");
  });

program.parse(process.argv);