import { createApp } from "./app";
(async () => {
  const app = await createApp();
  await app.listen(
    Number(process.env.PORT || 4187),
    process.env.HOST || "127.0.0.1",
  );
  console.log("NestJS iniciado.");
})().catch(() => {
  console.error("Falha ao iniciar API. Verifique o ambiente privado.");
  process.exit(1);
});
