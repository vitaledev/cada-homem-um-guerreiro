import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createSource, projectRoot } from "./source";
import {
  CategoryEntity,
  ProductEntity,
  VariantEntity,
  GalleryEntity,
  UserEntity,
  LegacyCartEntity,
  AuditEntity,
  MarkerEntity,
} from "./entities";
(async () => {
  const db = await createSource().initialize();
  if (process.env.DATABASE_URL) await db.runMigrations();
  if (await db.getRepository(MarkerEntity).findOneBy({ key: "django-v1" })) {
    console.log("Migração já importada; dados preservados.");
    await db.destroy();
    return;
  }
  const source = JSON.parse(
    readFileSync(
      resolve(projectRoot, "data/migration/django-export.json"),
      "utf8",
    ),
  );
  await db.transaction(async (em) => {
    for (const c of source.categories) await em.save(CategoryEntity, c);
    for (const p of source.products) {
      const { variants, gallery, ...record } = p;
      await em.save(ProductEntity, {
        ...record,
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      });
      for (const v of variants)
        await em.save(VariantEntity, { ...v, productId: p.id });
      for (const g of gallery)
        await em.save(GalleryEntity, { ...g, productId: p.id });
    }
    for (const user of source.users) await em.save(UserEntity, user);
    for (const session of source.carts) {
      const cart = Object.fromEntries(
        Object.entries(session.cart).map(([key, value]: any) => [
          key,
          {
            productId: value.product,
            variantId: value.variant || null,
            quantity: value.quantity,
          },
        ]),
      );
      await em.save(LegacyCartEntity, {
        hash: session.legacyHash,
        cart,
        expiresAt: new Date(session.expiresAt),
      });
    }
    for (const a of source.audit)
      await em.save(AuditEntity, {
        userId: a.userId,
        username:
          source.users.find((u: any) => u.id === a.userId)?.username ||
          "legado",
        action: "LEGACY_" + a.action,
        object: a.objectId,
        detail: a.changes,
        createdAt: new Date(a.createdAt),
      });
    await em.save(MarkerEntity, { key: "django-v1" });
  });
  if (process.env.DATABASE_URL) {
    for (const table of [
      "categories",
      "products",
      "variants",
      "gallery",
      "users",
      "audit",
    ])
      await db.query(
        `SELECT setval(pg_get_serial_sequence('${table}','id'),COALESCE((SELECT MAX(id) FROM "${table}"),1),EXISTS(SELECT 1 FROM "${table}"))`,
      );
  }
  console.log(
    `Importados ${source.products.length} produtos e ${source.categories.length} categorias. Credenciais e mídia preservadas.`,
  );
  await db.destroy();
})().catch((e) => {
  console.error(
    "Importação falhou:",
    e.name,
    e.code || "verificar dados privados",
  );
  process.exit(1);
});
