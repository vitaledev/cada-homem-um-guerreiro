import {
  Inject,
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { randomBytes, createHash, timingSafeEqual } from "node:crypto";
import { Request, Response } from "express";
import { DB } from "../database/source";
import {
  SessionEntity,
  UserEntity,
  LegacyCartEntity,
} from "../database/entities";
export type AuthRequest = Request & {
  session: SessionEntity;
  actor: UserEntity | null;
};
export const digest = (value: string) =>
  createHash("sha256").update(value).digest("hex");
export const token = () => randomBytes(32).toString("hex");
@Injectable()
export class Sessions {
  constructor(@Inject(DB) private db: DataSource) {}
  async create(
    res: Response,
    cart: SessionEntity["cart"] = {},
    userId: number | null = null,
  ) {
    const id = token();
    const session = this.db.getRepository(SessionEntity).create({
      hash: digest(id),
      csrf: token(),
      cart,
      userId,
      expiresAt: new Date(Date.now() + 3600000),
    });
    await this.db.getRepository(SessionEntity).save(session);
    res.cookie("guerreiros_session", id, {
      httpOnly: true,
      secure: process.env.APP_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 3600000,
    });
    return session;
  }
  async get(req: Request, res: Response) {
    const cookie = req.cookies?.guerreiros_session;
    let session = cookie
      ? await this.db
          .getRepository(SessionEntity)
          .findOneBy({ hash: digest(String(cookie)) })
      : null;
    if (session && session.expiresAt.getTime() > Date.now()) return session;
    const legacy = req.cookies?.sessionid
      ? await this.db
          .getRepository(LegacyCartEntity)
          .findOneBy({ hash: digest(String(req.cookies.sessionid)) })
      : null;
    session = await this.create(
      res,
      legacy && legacy.expiresAt.getTime() > Date.now() ? legacy.cart : {},
    );
    if (legacy)
      await this.db
        .getRepository(LegacyCartEntity)
        .delete({ hash: legacy.hash });
    return session;
  }
  async user(session: SessionEntity) {
    return session.userId
      ? await this.db
          .getRepository(UserEntity)
          .findOneBy({ id: session.userId, active: true })
      : null;
  }
  async rotate(current: SessionEntity, res: Response, userId: number | null) {
    await this.db.getRepository(SessionEntity).delete({ hash: current.hash });
    return this.create(res, current.cart, userId);
  }
  async save(session: SessionEntity) {
    await this.db.getRepository(SessionEntity).save(session);
  }
}
@Injectable()
export class SessionGuard implements CanActivate {
  constructor(private sessions: Sessions) {}
  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest<AuthRequest>();
    const res = context.switchToHttp().getResponse<Response>();
    req.session = await this.sessions.get(req, res);
    req.actor = await this.sessions.user(req.session);
    res.setHeader("Cache-Control", "no-store, private");
    if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
      const allowed = (
        process.env.APP_ORIGINS || "http://127.0.0.1:8000,http://localhost:8000"
      ).split(",");
      if (!req.headers.origin || !allowed.includes(req.headers.origin))
        throw new ForbiddenException("Origem inválida. Recarregue a página.");
      const supplied = String(req.headers["x-csrf-token"] || "");
      const actual = req.session.csrf;
      if (
        !/^[a-f0-9]{64}$/.test(supplied) ||
        !timingSafeEqual(Buffer.from(supplied), Buffer.from(actual))
      )
        throw new ForbiddenException(
          "Sessão desatualizada. Recarregue a página.",
        );
    }
    return true;
  }
}
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext) {
    const actor = context.switchToHttp().getRequest<AuthRequest>().actor;
    if (!actor) throw new UnauthorizedException("Entre para acessar a gestão.");
    if (!actor.canManageCatalog || !["ADMIN", "EDITOR"].includes(actor.role))
      throw new ForbiddenException("Conta sem permissão de gestão.");
    return true;
  }
}
