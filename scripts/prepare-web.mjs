import { cpSync, mkdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const web = resolve(root, "apps/web");
const target = resolve(web, ".next/standalone/apps/web");
mkdirSync(target, { recursive: true });
cpSync(resolve(web, "public"), resolve(target, "public"), { recursive: true });
cpSync(resolve(web, ".next/static"), resolve(target, ".next/static"), {
  recursive: true,
});
console.log("Artefato standalone preparado com imagens, fontes e estáticos.");
