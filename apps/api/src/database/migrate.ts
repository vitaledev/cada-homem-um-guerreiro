import { createSource } from "./source";
(async () => {
  const db = await createSource().initialize();
  if (process.env.DATABASE_URL) await db.runMigrations();
  await db.destroy();
  console.log("Migrações aplicadas.");
})().catch(() => {
  console.error(
    "Falha ao aplicar migrações. Verifique a configuração privada do banco.",
  );
  process.exit(1);
});
