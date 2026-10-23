import { readFileSync } from "node:fs";
import { createSource } from "../database/source";
import { UserEntity } from "../database/entities";
import { hashPassword } from "./password";
(async () => {
  const [username, passwordFile] = process.argv.slice(2);
  if (!username || !passwordFile || !/^[-\w.@+]{1,150}$/.test(username))
    throw new Error("Uso: create-admin <usuario> <arquivo-privado-da-senha>");
  const password = readFileSync(passwordFile, "utf8").replace(/\r?\n$/, "");
  if (password.length < 12 || password.length > 200)
    throw new Error("A senha deve ter entre 12 e 200 caracteres.");
  const db = await createSource().initialize();
  if (await db.getRepository(UserEntity).existsBy({ username })) {
    await db.destroy();
    throw new Error("Usuário já existe. Nenhuma credencial foi alterada.");
  }
  await db.getRepository(UserEntity).save({
    username,
    passwordHash: hashPassword(password),
    role: "ADMIN",
    active: true,
    canManageCatalog: true,
  });
  await db.destroy();
  console.log("Administrador criado. A senha não foi exibida.");
})().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
