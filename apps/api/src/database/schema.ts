import { MigrationInterface, QueryRunner } from "typeorm";
export class InitialSchema1792620000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`
 CREATE TABLE categories (id SERIAL PRIMARY KEY,name varchar NOT NULL,slug varchar NOT NULL UNIQUE,"order" integer NOT NULL DEFAULT 0);
 CREATE TABLE products (id SERIAL PRIMARY KEY,title varchar NOT NULL,slug varchar NOT NULL UNIQUE,sku varchar NOT NULL UNIQUE,"categoryId" integer NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,subtitle varchar NOT NULL DEFAULT '',description text NOT NULL,"priceCents" integer NOT NULL CHECK("priceCents">0),"comparePriceCents" integer,"imageUrl" varchar NOT NULL,"imageAlt" varchar NOT NULL DEFAULT '',stock integer NOT NULL DEFAULT 0 CHECK(stock>=0),active boolean NOT NULL DEFAULT false,featured boolean NOT NULL DEFAULT false,conceptual boolean NOT NULL DEFAULT false,"createdAt" timestamptz NOT NULL,"updatedAt" timestamptz NOT NULL,CHECK("comparePriceCents" IS NULL OR "comparePriceCents">"priceCents"));
 CREATE TABLE variants (id SERIAL PRIMARY KEY,"productId" integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,name varchar NOT NULL,sku varchar NOT NULL UNIQUE,stock integer NOT NULL CHECK(stock>=0),"priceCents" integer CHECK("priceCents" IS NULL OR "priceCents">0));
 CREATE TABLE gallery (id SERIAL PRIMARY KEY,"productId" integer NOT NULL REFERENCES products(id) ON DELETE CASCADE,url varchar NOT NULL,alt varchar NOT NULL,"order" integer NOT NULL DEFAULT 0);
 CREATE TABLE users (id SERIAL PRIMARY KEY,username varchar NOT NULL UNIQUE,"passwordHash" varchar NOT NULL,role varchar NOT NULL,active boolean NOT NULL,"canManageCatalog" boolean NOT NULL);
 CREATE TABLE sessions (hash varchar PRIMARY KEY,"userId" integer,csrf varchar NOT NULL,cart text NOT NULL,"expiresAt" timestamptz NOT NULL);
 CREATE TABLE legacy_carts (hash varchar PRIMARY KEY,cart text NOT NULL,"expiresAt" timestamptz NOT NULL);
 CREATE TABLE login_attempts (key varchar PRIMARY KEY,count integer NOT NULL,"expiresAt" timestamptz NOT NULL);
 CREATE TABLE audit (id SERIAL PRIMARY KEY,"userId" integer,username varchar NOT NULL,action varchar NOT NULL,object varchar NOT NULL,detail text NOT NULL,"createdAt" timestamptz NOT NULL);
 CREATE TABLE markers (key varchar PRIMARY KEY);
 CREATE INDEX products_category_active ON products("categoryId",active); CREATE INDEX variants_product ON variants("productId"); CREATE INDEX gallery_product ON gallery("productId"); CREATE INDEX sessions_expiry ON sessions("expiresAt");
 `);
  }
  async down(q: QueryRunner) {
    throw new Error(
      "Reversão destrutiva bloqueada. Restaurar backup validado.",
    );
  }
}
export class TurmaItemProducts1792650000001 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(
      `ALTER TABLE turma_items ADD COLUMN IF NOT EXISTS "productId" integer REFERENCES products(id) ON DELETE SET NULL;`,
    );
  }
  async down(q: QueryRunner) {
    throw new Error(
      "Reversão destrutiva bloqueada. Restaurar backup validado.",
    );
  }
}
export class TurmasEncontros1792650000000 implements MigrationInterface {
  async up(q: QueryRunner) {
    await q.query(`
 CREATE TABLE turmas (id SERIAL PRIMARY KEY,"bookLevel" integer NOT NULL CHECK("bookLevel" BETWEEN 1 AND 4),title varchar NOT NULL,slug varchar NOT NULL UNIQUE,subtitle varchar NOT NULL DEFAULT '',description text NOT NULL DEFAULT '',status varchar NOT NULL DEFAULT 'DRAFT',"leaderUserId" integer REFERENCES users(id) ON DELETE SET NULL,"priceCents" integer NOT NULL DEFAULT 0,"seatsTotal" integer NOT NULL DEFAULT 0,"startDate" timestamptz,imageUrl varchar NOT NULL DEFAULT '',imageAlt varchar NOT NULL DEFAULT '',"createdAt" timestamptz NOT NULL,"updatedAt" timestamptz NOT NULL);
 CREATE TABLE turma_items (id SERIAL PRIMARY KEY,"turmaId" integer NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,"productId" integer REFERENCES products(id) ON DELETE SET NULL,name varchar NOT NULL,description varchar NOT NULL DEFAULT '',"priceCents" integer,"required" boolean NOT NULL DEFAULT true,"order" integer NOT NULL DEFAULT 0);
 CREATE TABLE turma_requests (id SERIAL PRIMARY KEY,"turmaId" integer REFERENCES turmas(id) ON DELETE SET NULL,"bookLevel" integer NOT NULL,"userId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,name varchar NOT NULL,contact varchar NOT NULL,message text NOT NULL DEFAULT '',status varchar NOT NULL DEFAULT 'PENDING',"decidedById" integer REFERENCES users(id) ON DELETE SET NULL,"decisionNote" text NOT NULL DEFAULT '',"createdAt" timestamptz NOT NULL,"decidedAt" timestamptz);
 CREATE TABLE turma_enrollments (id SERIAL PRIMARY KEY,"turmaId" integer NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,"userId" integer NOT NULL REFERENCES users(id) ON DELETE CASCADE,"requestId" integer REFERENCES turma_requests(id) ON DELETE SET NULL,status varchar NOT NULL DEFAULT 'RESERVED',"paymentRef" varchar NOT NULL DEFAULT '',"createdAt" timestamptz NOT NULL,"confirmedAt" timestamptz,UNIQUE("turmaId","userId"));
 CREATE TABLE turma_modules (id SERIAL PRIMARY KEY,"turmaId" integer NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,title varchar NOT NULL,summary varchar NOT NULL DEFAULT '',"order" integer NOT NULL DEFAULT 0,status varchar NOT NULL DEFAULT 'DRAFT',"createdById" integer REFERENCES users(id) ON DELETE SET NULL,"updatedAt" timestamptz NOT NULL);
 CREATE TABLE turma_lessons (id SERIAL PRIMARY KEY,"moduleId" integer NOT NULL REFERENCES turma_modules(id) ON DELETE CASCADE,"turmaId" integer NOT NULL REFERENCES turmas(id) ON DELETE CASCADE,title varchar NOT NULL,summary varchar NOT NULL DEFAULT '',content text NOT NULL DEFAULT '',"attachmentUrl" varchar NOT NULL DEFAULT '',"attachmentLabel" varchar NOT NULL DEFAULT '',"order" integer NOT NULL DEFAULT 0,status varchar NOT NULL DEFAULT 'DRAFT',"updatedAt" timestamptz NOT NULL);
 CREATE TABLE turma_env_config ("turmaId" integer PRIMARY KEY REFERENCES turmas(id) ON DELETE CASCADE,"heroImageUrl" varchar NOT NULL DEFAULT '',"heroImageAlt" varchar NOT NULL DEFAULT '',"welcomeTitle" varchar NOT NULL DEFAULT '',"welcomeText" text NOT NULL DEFAULT '',accent varchar NOT NULL DEFAULT 'cyan',"showRoster" boolean NOT NULL DEFAULT false,"showSchedule" boolean NOT NULL DEFAULT true,"updatedAt" timestamptz NOT NULL);
 CREATE TABLE turma_leaders (id SERIAL PRIMARY KEY,"userId" integer NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,"grantedById" integer REFERENCES users(id) ON DELETE SET NULL,"createdAt" timestamptz NOT NULL);
 CREATE INDEX turmas_public ON turmas(status,"bookLevel"); CREATE INDEX turma_requests_status ON turma_requests(status,"bookLevel"); CREATE INDEX turma_modules_turma ON turma_modules("turmaId",status); CREATE INDEX turma_lessons_module ON turma_lessons("moduleId",status); CREATE INDEX turma_enrollments_turma ON turma_enrollments("turmaId",status);
 `);
  }
  async down(q: QueryRunner) {
    throw new Error(
      "Reversão destrutiva bloqueada. Restaurar backup validado.",
    );
  }
}
