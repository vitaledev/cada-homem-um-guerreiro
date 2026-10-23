import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  Res,
  UseGuards,
  Inject,
  UnauthorizedException,
  HttpException,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { Response } from "express";
import { loginSchema, registerSchema } from "@guerreiros/contracts";
import { Sessions, SessionGuard, AuthRequest, digest } from "./session";
import {
  UserEntity,
  LoginAttemptEntity,
  AuditEntity,
  TurmaLeaderEntity,
} from "../database/entities";
import { DB } from "../database/source";
import { hashPassword, verifyPassword } from "./password";
@Controller()
@UseGuards(SessionGuard)
export class AuthController {
  constructor(
    private sessions: Sessions,
    @Inject(DB) private db: DataSource,
  ) {}
  @Get("session") get(@Req() req: AuthRequest) {
    return this.dto(req);
  }
  async dto(req: AuthRequest) {
    const leader = req.actor
      ? await this.db
          .getRepository(TurmaLeaderEntity)
          .existsBy({ userId: req.actor.id })
      : false;
    return {
      csrfToken: req.session.csrf,
      user: req.actor
        ? {
            id: req.actor.id,
            username: req.actor.username,
            role: req.actor.role,
            canManage: req.actor.canManageCatalog,
            leader,
          }
        : null,
      cartCount: Object.values(req.session.cart).reduce(
        (n, v) => n + v.quantity,
        0,
      ),
    };
  }
  @Post("auth/login") async login(
    @Body() body: unknown,
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = loginSchema.parse(body);
    const key = digest(input.username.toLowerCase() + "|" + req.ip);
    const repo = this.db.getRepository(LoginAttemptEntity);
    let attempt = await repo.findOneBy({ key });
    if (
      attempt &&
      attempt.expiresAt.getTime() > Date.now() &&
      attempt.count >= 5
    )
      throw new HttpException("Muitas tentativas. Aguarde 15 minutos.", 429);
    const user = await this.db
      .getRepository(UserEntity)
      .findOneBy({ username: input.username, active: true });
    const valid = verifyPassword(
      input.password,
      user?.passwordHash ||
        "pbkdf2_sha256$1000000$dummy$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=",
    );
    if (!user || !valid) {
      if (!attempt || attempt.expiresAt.getTime() <= Date.now())
        attempt = repo.create({
          key,
          count: 0,
          expiresAt: new Date(Date.now() + 900000),
        });
      attempt.count += 1;
      await repo.save(attempt);
      throw new UnauthorizedException("Usuário ou senha inválidos.");
    }
    await repo.delete({ key });
    req.session = await this.sessions.rotate(req.session, res, user.id);
    req.actor = user;
    await this.db.getRepository(AuditEntity).save({
      userId: user.id,
      username: user.username,
      action: "LOGIN",
      object: "session",
      detail: "Autenticação concluída",
      createdAt: new Date(),
    });
    return this.dto(req);
  }
  @Post("auth/register") async register(
    @Body() body: unknown,
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    const input = registerSchema.parse(body);
    const key = digest("register|" + req.ip);
    const repo = this.db.getRepository(LoginAttemptEntity);
    let attempt = await repo.findOneBy({ key });
    if (
      attempt &&
      attempt.expiresAt.getTime() > Date.now() &&
      attempt.count >= 5
    )
      throw new HttpException("Muitas tentativas. Aguarde 15 minutos.", 429);
    if (
      await this.db
        .getRepository(UserEntity)
        .existsBy({ username: input.username })
    )
      throw new HttpException("Este usuário já está cadastrado.", 409);
    if (!attempt || attempt.expiresAt.getTime() <= Date.now())
      attempt = repo.create({
        key,
        count: 0,
        expiresAt: new Date(Date.now() + 900000),
      });
    attempt.count += 1;
    await repo.save(attempt);
    const user = await this.db.getRepository(UserEntity).save({
      username: input.username,
      passwordHash: hashPassword(input.password),
      role: "CUSTOMER",
      active: true,
      canManageCatalog: false,
    });
    await repo.delete({ key });
    req.session = await this.sessions.rotate(req.session, res, user.id);
    req.actor = user;
    await this.db.getRepository(AuditEntity).save({
      userId: user.id,
      username: user.username,
      action: "REGISTER",
      object: "user",
      detail: "Conta de participante criada",
      createdAt: new Date(),
    });
    return this.dto(req);
  }
  @Post("auth/logout") async logout(
    @Req() req: AuthRequest,
    @Res({ passthrough: true }) res: Response,
  ) {
    req.session = await this.sessions.rotate(req.session, res, null);
    req.actor = null;
    return this.dto(req);
  }
}
