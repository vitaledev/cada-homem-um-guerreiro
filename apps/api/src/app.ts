import "reflect-metadata";
import {
  Module,
  Controller,
  Get,
  Catch,
  ExceptionFilter,
  ArgumentsHost,
  HttpException,
} from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { json, static as staticFiles } from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { ZodError } from "zod";
import { resolve } from "node:path";
import { projectRoot } from "./database/source";
import {
  DatabaseModule,
  AuthModule,
  CatalogModule,
  CartModule,
  AdminModule,
  MediaModule,
  TurmasModule,
} from "./modules";
@Controller("health")
class HealthController {
  @Get() get() {
    return { status: "ok", service: "guerreiros-api" };
  }
}
@Catch()
class Errors implements ExceptionFilter {
  catch(error: unknown, host: ArgumentsHost) {
    const res = host.switchToHttp().getResponse();
    if (error instanceof ZodError)
      return res.status(400).json({
        message: error.issues
          .map((i) => i.path.join(".") + ": " + i.message)
          .join("; "),
      });
    if (error instanceof HttpException) {
      const body = error.getResponse();
      return res
        .status(error.getStatus())
        .json(typeof body === "string" ? { message: body } : body);
    }
    const e = error as { code?: string };
    if (
      ["23505", "SQLITE_CONSTRAINT", "SQLITE_CONSTRAINT_UNIQUE"].includes(
        e.code || "",
      ) ||
      String(error).includes("UNIQUE constraint")
    )
      return res
        .status(409)
        .json({ message: "SKU ou endereço já utilizado. Revise os dados." });
    return res
      .status(500)
      .json({ message: "Não foi possível concluir a operação." });
  }
}
@Module({
  imports: [
    DatabaseModule,
    AuthModule,
    CatalogModule,
    CartModule,
    AdminModule,
    MediaModule,
    TurmasModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
export async function createApp() {
  if (
    process.env.APP_ENV === "production" &&
    (!process.env.APP_ORIGINS ||
      process.env.APP_ORIGINS.split(",").some((x) => !x.startsWith("https://")))
  )
    throw new Error(
      "Produção exige APP_ORIGINS com domínios HTTPS explícitos.",
    );
  const app = await NestFactory.create(AppModule, {
    logger: ["error", "warn"],
    bodyParser: false,
  });
  app.use(json({ limit: "256kb" }));
  app.use(cookieParser());
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: { defaultSrc: ["'none'"], frameAncestors: ["'none'"] },
      },
    }),
  );
  if (process.env.TRUST_PROXY === "true")
    app.getHttpAdapter().getInstance().set("trust proxy", 1);
  app.use(
    "/media",
    staticFiles(
      resolve(process.env.MEDIA_ROOT || resolve(projectRoot, "media")),
      {
        dotfiles: "deny",
        index: false,
        setHeaders: (res) => {
          res.setHeader("X-Content-Type-Options", "nosniff");
          res.setHeader(
            "Content-Security-Policy",
            "default-src 'none'; sandbox",
          );
        },
      },
    ),
  );
  app.setGlobalPrefix("api/v1");
  app.useGlobalFilters(new Errors());
  app.enableShutdownHooks();
  return app;
}
