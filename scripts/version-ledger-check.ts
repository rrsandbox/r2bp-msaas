import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const rootDir = process.cwd();
const ledgerPath = join(rootDir, "VERSION-CONTROL.md");
const packagePath = join(rootDir, "package.json");

function fail(message: string): never {
  console.error(`[version-ledger-check] FAIL: ${message}`);
  process.exit(1);
}

function warn(message: string) {
  console.warn(`[version-ledger-check] WARN: ${message}`);
}

function assertMatch(content: string, regex: RegExp, errorMessage: string) {
  if (!regex.test(content)) {
    fail(errorMessage);
  }
}

function main() {
  if (!existsSync(ledgerPath)) {
    fail("Arquivo VERSION-CONTROL.md nao encontrado na raiz.");
  }

  if (!existsSync(packagePath)) {
    fail("Arquivo package.json nao encontrado na raiz.");
  }

  const ledger = readFileSync(ledgerPath, "utf8");
  const pkgRaw = readFileSync(packagePath, "utf8");
  const pkg = JSON.parse(pkgRaw) as { version?: string };

  assertMatch(ledger, /#\s+Version Control and Compatibility Ledger/i, "Cabecalho principal do ledger nao encontrado.");
  assertMatch(ledger, /-\s+Baseline state:\s+`FROZEN`/i, "Estado baseline FROZEN nao encontrado.");
  assertMatch(ledger, /-\s+Freeze date:\s+`\d{4}-\d{2}-\d{2}`/i, "Freeze date nao encontrado em formato YYYY-MM-DD.");

  const baselineVersionMatch = ledger.match(/-\s+Baseline version:\s+`(\d+\.\d+\.\d+)`/i);
  if (!baselineVersionMatch) {
    fail("Baseline version nao encontrado ou fora do formato SemVer.");
  }

  const baselineVersion = baselineVersionMatch[1];

  assertMatch(
    ledger,
    new RegExp(`### \\[${baselineVersion.replace(/\./g, "\\.")}\\] - \\d{4}-\\d{2}-\\d{2}`),
    `Entrada de changelog da baseline version ${baselineVersion} nao encontrada.`,
  );

  assertMatch(
    ledger,
    /##\s+Compatibility Contracts\s+\(Must Preserve\)/i,
    "Secao de contratos de compatibilidade nao encontrada.",
  );

  assertMatch(
    ledger,
    /##\s+Derived Project Registration/i,
    "Secao de registro de projetos derivados nao encontrada.",
  );

  if (!pkg.version) {
    warn("package.json sem campo version; ignorando compatibilidade com changelog do package version.");
  } else {
    const escapedPkgVersion = pkg.version.replace(/\./g, "\\.");
    const packageVersionInLedger = new RegExp(`### \\[${escapedPkgVersion}\\] - \\d{4}-\\d{2}-\\d{2}`).test(ledger);

    if (!packageVersionInLedger) {
      warn(
        `Versao do package (${pkg.version}) ainda nao possui entrada no VERSION-CONTROL.md. Isso e esperado em baseline congelada; para release de derivado, adicione a entrada.`,
      );
    }
  }

  console.log("[version-ledger-check] OK: VERSION-CONTROL.md valido para baseline e compatibilidade.");
}

main();
