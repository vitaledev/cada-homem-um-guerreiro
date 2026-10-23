import "reflect-metadata";
import { DataSource } from "typeorm";
import { resolve } from "node:path";
import { mkdirSync, chmodSync } from "node:fs";
import { entities } from "./entities";
import {
  InitialSchema1792620000000,
  TurmasEncontros1792650000000,
} from "./schema";
export const projectRoot = process.env.PROJECT_ROOT
  ? resolve(process.env.PROJECT_ROOT)
  : resolve(process.cwd(), process.cwd().endsWith("/apps/api") ? "../.." : ".");
export function createSource() {
  const production = process.env.APP_ENV === "production";
  if (production && !process.env.DATABASE_URL?.startsWith("postgres"))
    throw new Error("Produção exige PostgreSQL próprio em DATABASE_URL.");
  mkdirSync(resolve(projectRoot, "data"), { recursive: true, mode: 0o700 });
  chmodSync(resolve(projectRoot, "data"), 0o700);
  return new DataSource(
    process.env.DATABASE_URL
      ? {
          type: "postgres",
          url: process.env.DATABASE_URL,
          entities,
          synchronize: false,
          migrations: [
            InitialSchema1792620000000,
            TurmasEncontros1792650000000,
          ],
          logging: false,
        }
      : {
          type: "sqljs",
          location:
            process.env.LOCAL_DB_PATH ||
            resolve(projectRoot, "data/next-nest.sqlite"),
          autoSave: true,
          entities,
          synchronize: true,
          logging: false,
        },
  );
}
export const DB = "DATABASE";
