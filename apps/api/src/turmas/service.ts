import {
  Inject,
  Injectable,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager, In } from "typeorm";
import {
  Turma,
  TurmaEnvironment,
  TurmaInput,
  TurmaLevel,
  TurmaModule,
  TurmaOverview,
  TurmaRequest,
  TurmaEnrollment,
  TurmaEnvConfig,
  EnvConfigInput,
  InterestInput,
  ModuleInput,
  LessonInput,
} from "@guerreiros/contracts";
import { DB } from "../database/source";
import {
  AuditEntity,
  TurmaEntity,
  TurmaEnrollmentEntity,
  TurmaEnvConfigEntity,
  TurmaItemEntity,
  TurmaLeaderEntity,
  TurmaLessonEntity,
  TurmaModuleEntity,
  TurmaRequestEntity,
  UserEntity,
} from "../database/entities";
import { AuthRequest } from "../auth/session";
import { randomBytes } from "node:crypto";

export const OPEN_TURMA_STATUS = ["OPEN", "CONFIRMED"];
export const defaultConfig = (turmaId: number): TurmaEnvConfig => ({
  turmaId,
  heroImageUrl: "",
  heroImageAlt: "",
  welcomeTitle: "",
  welcomeText: "",
  accent: "cyan",
  showRoster: false,
  showSchedule: true,
  updatedAt: new Date(0).toISOString(),
});

@Injectable()
export class TurmasService {
  constructor(@Inject(DB) public db: DataSource) {}
  isSuperAdmin(actor: UserEntity | null) {
    return !!actor && actor.role === "ADMIN" && actor.canManageCatalog;
  }
  async isLeader(actor: UserEntity | null) {
    if (!actor) return false;
    if (this.isSuperAdmin(actor)) return true;
    return this.db
      .getRepository(TurmaLeaderEntity)
      .existsBy({ userId: actor.id });
  }
  async canManage(actor: UserEntity | null, turma: TurmaEntity) {
    if (!actor) return false;
    if (this.isSuperAdmin(actor)) return true;
    return (await this.isLeader(actor)) && turma.leaderUserId === actor.id;
  }
  async requireLeader(actor: UserEntity | null) {
    if (!actor)
      throw new ForbiddenException("Entre para acessar a gestão de turmas.");
    if (!(await this.isLeader(actor)))
      throw new ForbiddenException(
        "Sua conta não tem privilégio de líder de turma.",
      );
    return actor;
  }
  async requireSuperAdmin(actor: UserEntity | null) {
    if (!this.isSuperAdmin(actor))
      throw new ForbiddenException(
        "Somente o gestor supremo pode executar esta ação.",
      );
    return actor as UserEntity;
  }
  async audit(
    em: EntityManager,
    actor: UserEntity,
    action: string,
    object: string,
    detail: string,
  ) {
    await em.save(AuditEntity, {
      userId: actor.id,
      username: actor.username,
      action,
      object,
      detail,
      createdAt: new Date(),
    });
  }
  async hydrate(rows: TurmaEntity[]): Promise<Turma[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const leaderIds = rows
      .map((r) => r.leaderUserId)
      .filter((x): x is number => !!x);
    const [items, taken, interests, leaders] = await Promise.all([
      this.db.getRepository(TurmaItemEntity).find({
        where: { turmaId: In(ids) },
        order: { order: "ASC", id: "ASC" },
      }),
      this.db
        .getRepository(TurmaEnrollmentEntity)
        .createQueryBuilder("e")
        .select("e.turmaId", "turmaId")
        .addSelect("COUNT(*)", "total")
        .where("e.turmaId IN (:...ids)", { ids })
        .andWhere("e.status IN (:...status)", {
          status: ["RESERVED", "CONFIRMED"],
        })
        .groupBy("e.turmaId")
        .getRawMany(),
      this.db
        .getRepository(TurmaRequestEntity)
        .createQueryBuilder("r")
        .select("r.turmaId", "turmaId")
        .addSelect("COUNT(*)", "total")
        .where("r.turmaId IN (:...ids)", { ids })
        .andWhere("r.status IN (:...status)", {
          status: ["PENDING", "APPROVED"],
        })
        .groupBy("r.turmaId")
        .getRawMany(),
      leaderIds.length
        ? this.db
            .getRepository(UserEntity)
            .find({ where: { id: In(leaderIds) } })
        : Promise.resolve([]),
    ]);
    return rows.map((t) => ({
      id: t.id,
      bookLevel: t.bookLevel as TurmaLevel,
      title: t.title,
      slug: t.slug,
      subtitle: t.subtitle,
      description: t.description,
      status: t.status as Turma["status"],
      leaderUserId: t.leaderUserId,
      leaderUsername: t.leaderUserId
        ? leaders.find((u) => u.id === t.leaderUserId)?.username || null
        : null,
      priceCents: t.priceCents,
      seatsTotal: t.seatsTotal,
      seatsTaken: Number(
        taken.find((x) => Number(x.turmaId) === t.id)?.total || 0,
      ),
      startDate: t.startDate ? t.startDate.toISOString() : null,
      imageUrl: t.imageUrl,
      imageAlt: t.imageAlt,
      interestCount: Number(
        interests.find((x) => Number(x.turmaId) === t.id)?.total || 0,
      ),
      createdAt: t.createdAt.toISOString(),
      updatedAt: t.updatedAt.toISOString(),
      items: items
        .filter((i) => i.turmaId === t.id)
        .map(
          ({
            id,
            turmaId,
            name,
            description,
            priceCents,
            required,
            order,
          }) => ({
            id,
            turmaId,
            name,
            description,
            priceCents,
            required,
            order,
          }),
        ),
    }));
  }
  async listPublic() {
    const rows = await this.db.getRepository(TurmaEntity).find({
      where: { status: In(["OPEN", "CONFIRMED", "FINISHED"]) },
      order: { bookLevel: "ASC", startDate: "ASC", id: "DESC" },
    });
    return this.hydrate(rows);
  }
  async byId(id: number): Promise<TurmaEntity> {
    const row = await this.db.getRepository(TurmaEntity).findOneBy({ id });
    if (!row) throw new NotFoundException("Turma não encontrada.");
    return row;
  }
  async one(slug: string, staff = false) {
    const row = await this.db
      .getRepository(TurmaEntity)
      .findOneBy(
        staff
          ? { slug }
          : { slug, status: In(["OPEN", "CONFIRMED", "FINISHED"]) },
      );
    if (!row) throw new NotFoundException("Turma não encontrada.");
    return (await this.hydrate([row]))[0];
  }
  async overview(actor: UserEntity): Promise<TurmaOverview> {
    const [requests, enrollments, ledRows, isLeader] = await Promise.all([
      this.db.getRepository(TurmaRequestEntity).find({
        where: { userId: actor.id },
        order: { createdAt: "DESC" },
        take: 50,
      }),
      this.db.getRepository(TurmaEnrollmentEntity).find({
        where: { userId: actor.id },
        order: { createdAt: "DESC" },
        take: 50,
      }),
      this.db.getRepository(TurmaEntity).find({
        where: { leaderUserId: actor.id },
        order: { id: "DESC" },
      }),
      this.isLeader(actor),
    ]);
    const turmaIds = [
      ...enrollments.map((e) => e.turmaId),
      ...ledRows.map((t) => t.id),
    ].filter((x, i, all) => all.indexOf(x) === i);
    const turmaRows = turmaIds.length
      ? await this.db
          .getRepository(TurmaEntity)
          .find({ where: { id: In(turmaIds) } })
      : [];
    const turmas = await this.hydrate(turmaRows);
    const requestIds = requests
      .map((r) => r.turmaId)
      .filter((x): x is number => !!x);
    const requestTurmas = requestIds.length
      ? await this.db
          .getRepository(TurmaEntity)
          .find({ where: { id: In(requestIds) } })
      : [];
    return {
      requests: requests.map((r) =>
        this.requestDto({
          ...r,
          user: { username: actor.username } as UserEntity,
          turmaTitle: r.turmaId
            ? requestTurmas.find((t) => t.id === r.turmaId)?.title || null
            : null,
        }),
      ),
      enrollments: enrollments.map((e) =>
        this.enrollmentDto(
          { ...e, user: { username: actor.username } as UserEntity },
          turmaRows.find((t) => t.id === e.turmaId) || undefined,
        ),
      ),
      ledTurmas: turmas.filter((t) => t.leaderUserId === actor.id),
      isLeader,
    };
  }
  requestDto(r: TurmaRequestEntity & { turmaTitle?: string | null }) {
    return {
      id: r.id,
      turmaId: r.turmaId,
      turmaTitle: r.turmaTitle ?? null,
      bookLevel: r.bookLevel as TurmaLevel,
      userId: r.userId,
      username: r.user?.username || "",
      name: r.name,
      contact: r.contact,
      message: r.message,
      status: r.status as TurmaRequest["status"],
      decisionNote: r.decisionNote,
      decidedBy: r.decidedBy?.username || null,
      createdAt: r.createdAt.toISOString(),
      decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
    };
  }
  enrollmentDto(e: TurmaEnrollmentEntity, turma?: TurmaEntity) {
    return {
      id: e.id,
      turmaId: e.turmaId,
      turmaTitle: turma?.title || e.turma?.title || "",
      turmaSlug: turma?.slug || e.turma?.slug || "",
      bookLevel: (turma?.bookLevel || e.turma?.bookLevel || 1) as TurmaLevel,
      userId: e.userId,
      username: e.user?.username || "",
      status: e.status as TurmaEnrollment["status"],
      paymentRef: e.paymentRef,
      createdAt: e.createdAt.toISOString(),
      confirmedAt: e.confirmedAt ? e.confirmedAt.toISOString() : null,
    };
  }
  async nextTurmaForLevel(level: number) {
    return this.db.getRepository(TurmaEntity).findOne({
      where: { bookLevel: level, status: In(OPEN_TURMA_STATUS) },
      order: { startDate: "ASC", id: "DESC" },
    });
  }
  async createInterest(actor: UserEntity, input: InterestInput) {
    let turma: TurmaEntity | null = null;
    if (input.turmaId) {
      turma = await this.db
        .getRepository(TurmaEntity)
        .findOneBy({ id: input.turmaId, status: In(OPEN_TURMA_STATUS) });
      if (!turma) throw new NotFoundException("Turma indisponível no momento.");
      if (turma.bookLevel !== input.bookLevel)
        throw new BadRequestException("A turma selecionada é de outro livro.");
    } else turma = await this.nextTurmaForLevel(input.bookLevel);
    const existing = await this.db.getRepository(TurmaRequestEntity).find({
      where: { userId: actor.id, bookLevel: input.bookLevel },
      order: { createdAt: "DESC" },
    });
    if (existing.some((r) => r.status === "PENDING"))
      throw new ConflictException(
        "Você já tem uma solicitação em análise para este livro.",
      );
    if (existing.some((r) => r.status === "APPROVED"))
      throw new ConflictException(
        "Sua solicitação já foi aprovada. Conclua a matrícula.",
      );
    if (existing.some((r) => r.status === "CONVERTED"))
      throw new ConflictException("Você já participa da turma deste livro.");
    if (turma) {
      const enrollment = await this.db
        .getRepository(TurmaEnrollmentEntity)
        .findOneBy({ turmaId: turma.id, userId: actor.id });
      if (enrollment && enrollment.status !== "CANCELLED")
        throw new ConflictException("Você já tem matrícula nesta turma.");
    }
    const row = await this.db.getRepository(TurmaRequestEntity).save({
      turmaId: turma?.id || null,
      bookLevel: input.bookLevel,
      userId: actor.id,
      name: input.name,
      contact: input.contact,
      message: input.message,
      status: "PENDING",
      decisionNote: "",
      createdAt: new Date(),
      decidedAt: null,
      decidedById: null,
    });
    await this.db.getRepository(AuditEntity).save({
      userId: actor.id,
      username: actor.username,
      action: "TURMA_INTEREST",
      object: String(row.id),
      detail: "Solicitação de interesse em Guerreiro " + input.bookLevel,
      createdAt: new Date(),
    });
    return this.requestDto({ ...row, turmaTitle: turma?.title || null });
  }
  async enroll(actor: UserEntity, turmaId: number) {
    const turma = await this.byId(turmaId);
    if (turma.status !== "CONFIRMED")
      throw new BadRequestException(
        "As compras desta turma abrem quando o gestor confirmar que ela vai acontecer.",
      );
    const request = await this.db
      .getRepository(TurmaRequestEntity)
      .findOneBy({ userId: actor.id, turmaId: turma.id, status: "APPROVED" });
    if (!request)
      throw new ForbiddenException(
        "Manifeste o seu interesse e aguarde a análise do gestor antes da compra.",
      );
    const existing = await this.db
      .getRepository(TurmaEnrollmentEntity)
      .findOneBy({ turmaId: turma.id, userId: actor.id });
    if (existing && existing.status === "CONFIRMED")
      throw new ConflictException("Você já faz parte desta turma.");
    if (existing && existing.status === "RESERVED")
      return this.enrollmentDto(existing, turma);
    if (turma.seatsTotal > 0) {
      const taken = await this.db
        .getRepository(TurmaEnrollmentEntity)
        .countBy({ turmaId: turma.id, status: In(["RESERVED", "CONFIRMED"]) });
      if (taken >= turma.seatsTotal)
        throw new ConflictException("Esta turma já atingiu o número de vagas.");
    }
    const row = await this.db.getRepository(TurmaEnrollmentEntity).save({
      turmaId: turma.id,
      userId: actor.id,
      requestId: request.id,
      status: "RESERVED",
      paymentRef: "",
      createdAt: new Date(),
      confirmedAt: null,
    });
    await this.db.getRepository(AuditEntity).save({
      userId: actor.id,
      username: actor.username,
      action: "TURMA_ENROLL",
      object: String(turma.id),
      detail: "Reserva de vaga em " + turma.title,
      createdAt: new Date(),
    });
    return this.enrollmentDto(row, turma);
  }
  async checkout(actor: UserEntity, turmaId: number) {
    const turma = await this.byId(turmaId);
    const enrollment = await this.db
      .getRepository(TurmaEnrollmentEntity)
      .findOneBy({ turmaId: turma.id, userId: actor.id, status: "RESERVED" });
    if (!enrollment)
      throw new BadRequestException(
        "Não há matrícula aguardando pagamento nesta turma.",
      );
    enrollment.status = "CONFIRMED";
    enrollment.paymentRef =
      "SIM-" + randomBytes(4).toString("hex").toUpperCase();
    enrollment.confirmedAt = new Date();
    await this.db.getRepository(TurmaEnrollmentEntity).save(enrollment);
    if (enrollment.requestId) {
      await this.db
        .getRepository(TurmaRequestEntity)
        .update({ id: enrollment.requestId }, { status: "CONVERTED" });
    }
    await this.db.getRepository(AuditEntity).save({
      userId: actor.id,
      username: actor.username,
      action: "TURMA_CHECKOUT",
      object: String(turma.id),
      detail: "Checkout simulado concluído em " + turma.title,
      createdAt: new Date(),
    });
    return {
      enrollment: this.enrollmentDto(enrollment, turma),
      paymentRef: enrollment.paymentRef,
      ambiente: "/turma/" + turma.slug + "/ambiente/",
    };
  }
  async environment(
    actor: UserEntity,
    slug: string,
  ): Promise<TurmaEnvironment> {
    const turma = await this.db.getRepository(TurmaEntity).findOneBy({ slug });
    if (!turma) throw new NotFoundException("Turma não encontrada.");
    const staff = await this.canManage(actor, turma);
    const enrollment = await this.db
      .getRepository(TurmaEnrollmentEntity)
      .findOneBy({ turmaId: turma.id, userId: actor.id });
    if (!staff) {
      if (["DRAFT", "CANCELLED"].includes(turma.status))
        throw new NotFoundException("Turma não encontrada.");
      if (!enrollment || enrollment.status !== "CONFIRMED")
        throw new ForbiddenException(
          "O ambiente é liberado após a confirmação da matrícula.",
        );
    }
    const [config, modules, roster] = await Promise.all([
      this.config(turma.id),
      this.modules(turma.id, staff),
      this.roster(turma.id),
    ]);
    const full = (await this.hydrate([turma]))[0];
    return {
      turma: full,
      config,
      modules,
      roster: config.showRoster || staff ? roster : [],
      role: this.isSuperAdmin(actor) ? "ADMIN" : staff ? "LEADER" : "STUDENT",
    };
  }
  async config(turmaId: number): Promise<TurmaEnvConfig> {
    const row = await this.db
      .getRepository(TurmaEnvConfigEntity)
      .findOneBy({ turmaId });
    if (!row) return defaultConfig(turmaId);
    return {
      turmaId,
      heroImageUrl: row.heroImageUrl,
      heroImageAlt: row.heroImageAlt,
      welcomeTitle: row.welcomeTitle,
      welcomeText: row.welcomeText,
      accent: row.accent === "deep" ? "deep" : "cyan",
      showRoster: row.showRoster,
      showSchedule: row.showSchedule,
      updatedAt: row.updatedAt.toISOString(),
    };
  }
  async roster(turmaId: number) {
    const rows = await this.db.getRepository(TurmaEnrollmentEntity).find({
      where: { turmaId, status: "CONFIRMED" },
      order: { confirmedAt: "ASC", id: "ASC" },
      take: 200,
    });
    const users = rows.length
      ? await this.db.getRepository(UserEntity).find({
          where: { id: In(rows.map((r) => r.userId)) },
        })
      : [];
    return rows.map((r) => ({
      username: users.find((u) => u.id === r.userId)?.username || "guerreiro",
      since: (r.confirmedAt || r.createdAt).toISOString(),
    }));
  }
  async modules(turmaId: number, staff = false): Promise<TurmaModule[]> {
    const moduleRows = await this.db.getRepository(TurmaModuleEntity).find({
      where: staff ? { turmaId } : { turmaId, status: "PUBLISHED" },
      order: { order: "ASC", id: "ASC" },
    });
    const lessons = await this.db.getRepository(TurmaLessonEntity).find({
      where: staff ? { turmaId } : { turmaId, status: "PUBLISHED" },
      order: { order: "ASC", id: "ASC" },
    });
    return moduleRows.map((m) => ({
      id: m.id,
      turmaId,
      title: m.title,
      summary: m.summary,
      order: m.order,
      status: m.status as TurmaModule["status"],
      updatedAt: m.updatedAt.toISOString(),
      lessons: lessons
        .filter((l) => l.moduleId === m.id)
        .map((l) => ({
          id: l.id,
          moduleId: l.moduleId,
          title: l.title,
          summary: l.summary,
          content: l.content,
          attachmentUrl: l.attachmentUrl,
          attachmentLabel: l.attachmentLabel,
          order: l.order,
          status: l.status as TurmaModule["status"],
          updatedAt: l.updatedAt.toISOString(),
        })),
    }));
  }
  async saveTurma(id: number | null, input: TurmaInput, actor: UserEntity) {
    const superAdmin = this.isSuperAdmin(actor);
    if (!superAdmin) await this.requireLeader(actor);
    const previous = id ? await this.byId(id) : null;
    if (id && !previous) throw new NotFoundException("Turma não encontrada.");
    if (previous && !superAdmin && previous.leaderUserId !== actor.id)
      throw new ForbiddenException("Esta turma pertence a outro líder.");
    if (!superAdmin && input.leaderUserId && input.leaderUserId !== actor.id)
      throw new BadRequestException(
        "Líder da turma definido somente pelo gestor.",
      );
    const slugTaken = await this.db
      .getRepository(TurmaEntity)
      .findOneBy({ slug: input.slug });
    if (slugTaken && slugTaken.id !== id)
      throw new ConflictException("Já existe uma turma com este endereço.");
    let saved: TurmaEntity;
    await this.db.transaction(async (em) => {
      saved = await em.save(
        TurmaEntity,
        em.create(TurmaEntity, {
          ...(previous || {}),
          bookLevel: input.bookLevel,
          title: input.title,
          slug: input.slug,
          subtitle: input.subtitle,
          description: input.description,
          status: superAdmin
            ? input.status
            : previous
              ? previous.status
              : "DRAFT",
          leaderUserId: superAdmin
            ? input.leaderUserId
            : previous?.leaderUserId || actor.id,
          priceCents: superAdmin ? input.priceCents : previous?.priceCents || 0,
          seatsTotal: superAdmin ? input.seatsTotal : previous?.seatsTotal || 0,
          startDate: input.startDate ? new Date(input.startDate) : null,
          imageUrl: input.imageUrl,
          imageAlt: input.imageAlt,
          createdAt: previous?.createdAt || new Date(),
          updatedAt: new Date(),
        }),
      );
      if (superAdmin) {
        const existing = await em.findBy(TurmaItemEntity, {
          turmaId: saved.id,
        });
        const removed = existing.filter(
          (i) => !input.items.some((item) => item.id === i.id),
        );
        if (removed.length)
          await em.delete(TurmaItemEntity, {
            id: In(removed.map((i) => i.id)),
          });
        for (const item of input.items)
          await em.save(
            TurmaItemEntity,
            em.create(TurmaItemEntity, { ...item, turmaId: saved.id }),
          );
      }
      await this.audit(
        em,
        actor,
        id ? "UPDATE_TURMA" : "CREATE_TURMA",
        String(saved.id),
        saved.title,
      );
    });
    return (await this.hydrate([saved!]))[0];
  }
  async deleteTurma(id: number, actor: UserEntity) {
    await this.requireSuperAdmin(actor);
    const turma = await this.byId(id);
    await this.db.transaction(async (em) => {
      await em.delete(TurmaEntity, { id });
      await this.audit(em, actor, "DELETE_TURMA", String(id), turma.title);
    });
    return { ok: true };
  }
  async saveModule(
    turmaId: number,
    moduleId: number | null,
    input: ModuleInput,
    actor: UserEntity,
  ) {
    const turma = await this.byId(turmaId);
    if (!(await this.canManage(actor, turma)))
      throw new ForbiddenException("Você não gerencia esta turma.");
    const superAdmin = this.isSuperAdmin(actor);
    const previous = moduleId
      ? await this.db
          .getRepository(TurmaModuleEntity)
          .findOneBy({ id: moduleId, turmaId })
      : null;
    if (moduleId && !previous)
      throw new NotFoundException("Módulo não encontrado.");
    const saved = await this.db.getRepository(TurmaModuleEntity).save({
      ...(previous || {}),
      turmaId,
      title: input.title,
      summary: input.summary,
      order: input.order,
      status: superAdmin ? input.status : previous?.status || "DRAFT",
      createdById: actor.id,
      updatedAt: new Date(),
    });
    await this.db.getRepository(AuditEntity).save({
      userId: actor.id,
      username: actor.username,
      action: moduleId ? "UPDATE_TURMA_MODULE" : "CREATE_TURMA_MODULE",
      object: String(saved.id),
      detail: input.title + " · " + turma.title,
      createdAt: new Date(),
    });
    return saved;
  }
  async deleteModule(turmaId: number, moduleId: number, actor: UserEntity) {
    const turma = await this.byId(turmaId);
    if (!(await this.canManage(actor, turma)))
      throw new ForbiddenException("Você não gerencia esta turma.");
    const module = await this.db
      .getRepository(TurmaModuleEntity)
      .findOneBy({ id: moduleId, turmaId });
    if (!module) throw new NotFoundException("Módulo não encontrado.");
    await this.db.getRepository(TurmaModuleEntity).delete({ id: moduleId });
    await this.db.getRepository(AuditEntity).save({
      userId: actor.id,
      username: actor.username,
      action: "DELETE_TURMA_MODULE",
      object: String(moduleId),
      detail: module.title + " · " + turma.title,
      createdAt: new Date(),
    });
    return { ok: true };
  }
  async saveLesson(
    turmaId: number,
    moduleId: number,
    lessonId: number | null,
    input: LessonInput,
    actor: UserEntity,
  ) {
    const turma = await this.byId(turmaId);
    if (!(await this.canManage(actor, turma)))
      throw new ForbiddenException("Você não gerencia esta turma.");
    const module = await this.db
      .getRepository(TurmaModuleEntity)
      .findOneBy({ id: moduleId, turmaId });
    if (!module) throw new NotFoundException("Módulo não encontrado.");
    const superAdmin = this.isSuperAdmin(actor);
    const previous = lessonId
      ? await this.db
          .getRepository(TurmaLessonEntity)
          .findOneBy({ id: lessonId, turmaId })
      : null;
    if (lessonId && !previous)
      throw new NotFoundException("Aula não encontrada.");
    const saved = await this.db.getRepository(TurmaLessonEntity).save({
      ...(previous || {}),
      moduleId,
      turmaId,
      title: input.title,
      summary: input.summary,
      content: input.content,
      attachmentUrl: input.attachmentUrl,
      attachmentLabel: input.attachmentLabel,
      order: input.order,
      status: superAdmin ? input.status : previous?.status || "DRAFT",
      updatedAt: new Date(),
    });
    await this.db.getRepository(AuditEntity).save({
      userId: actor.id,
      username: actor.username,
      action: lessonId ? "UPDATE_TURMA_LESSON" : "CREATE_TURMA_LESSON",
      object: String(saved.id),
      detail: input.title + " · " + turma.title,
      createdAt: new Date(),
    });
    return saved;
  }
  async deleteLesson(turmaId: number, lessonId: number, actor: UserEntity) {
    const turma = await this.byId(turmaId);
    if (!(await this.canManage(actor, turma)))
      throw new ForbiddenException("Você não gerencia esta turma.");
    const lesson = await this.db
      .getRepository(TurmaLessonEntity)
      .findOneBy({ id: lessonId, turmaId });
    if (!lesson) throw new NotFoundException("Aula não encontrada.");
    await this.db.getRepository(TurmaLessonEntity).delete({ id: lessonId });
    await this.db.getRepository(AuditEntity).save({
      userId: actor.id,
      username: actor.username,
      action: "DELETE_TURMA_LESSON",
      object: String(lessonId),
      detail: lesson.title + " · " + turma.title,
      createdAt: new Date(),
    });
    return { ok: true };
  }
  async manageables(actor: UserEntity) {
    const rows = await (this.isSuperAdmin(actor)
      ? this.db.getRepository(TurmaEntity).find({ order: { id: "DESC" } })
      : this.db
          .getRepository(TurmaEntity)
          .find({ where: { leaderUserId: actor.id }, order: { id: "DESC" } }));
    return this.hydrate(rows);
  }
  async allRequests(filter: Record<string, string> = {}) {
    const rows = await this.db.getRepository(TurmaRequestEntity).find({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.bookLevel ? { bookLevel: Number(filter.bookLevel) } : {}),
      },
      order: { createdAt: "DESC" },
      take: 300,
    });
    const turmaIds = rows.map((r) => r.turmaId).filter((x): x is number => !!x);
    const [users, turmas] = await Promise.all([
      rows.length
        ? this.db
            .getRepository(UserEntity)
            .find({ where: { id: In(rows.map((r) => r.userId)) } })
        : Promise.resolve([]),
      turmaIds.length
        ? this.db
            .getRepository(TurmaEntity)
            .find({ where: { id: In(turmaIds) } })
        : Promise.resolve([]),
    ]);
    const deciders = rows
      .map((r) => r.decidedById)
      .filter((x): x is number => !!x);
    const deciderRows = deciders.length
      ? await this.db
          .getRepository(UserEntity)
          .find({ where: { id: In(deciders) } })
      : [];
    return rows.map((r) =>
      this.requestDto({
        ...r,
        user:
          users.find((u) => u.id === r.userId) ||
          ({ username: "—" } as UserEntity),
        decidedBy: deciderRows.find((u) => u.id === r.decidedById) || null,
        turmaTitle: r.turmaId
          ? turmas.find((t) => t.id === r.turmaId)?.title || null
          : null,
      }),
    );
  }
  async allEnrollments(filter: Record<string, string> = {}) {
    const rows = await this.db.getRepository(TurmaEnrollmentEntity).find({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.turmaId ? { turmaId: Number(filter.turmaId) } : {}),
      },
      order: { createdAt: "DESC" },
      take: 300,
    });
    const turmaIds = rows.map((r) => r.turmaId).filter((x): x is number => !!x);
    const [users, turmas] = await Promise.all([
      rows.length
        ? this.db
            .getRepository(UserEntity)
            .find({ where: { id: In(rows.map((r) => r.userId)) } })
        : Promise.resolve([]),
      turmaIds.length
        ? this.db
            .getRepository(TurmaEntity)
            .find({ where: { id: In(turmaIds) } })
        : Promise.resolve([]),
    ]);
    return rows.map((r) =>
      this.enrollmentDto(
        {
          ...r,
          user:
            users.find((u) => u.id === r.userId) ||
            ({ username: "—" } as UserEntity),
        },
        turmas.find((t) => t.id === r.turmaId) || undefined,
      ),
    );
  }
  async staffView(actor: UserEntity, turmaId: number) {
    const turma = await this.byId(turmaId);
    if (!(await this.canManage(actor, turma)))
      throw new ForbiddenException("Você não gerencia esta turma.");
    const [enrollments, requests, modules, config] = await Promise.all([
      this.db.getRepository(TurmaEnrollmentEntity).find({
        where: { turmaId },
        order: { createdAt: "DESC" },
        take: 500,
      }),
      this.db.getRepository(TurmaRequestEntity).find({
        where: { turmaId },
        order: { createdAt: "DESC" },
        take: 500,
      }),
      this.modules(turmaId, true),
      this.config(turmaId),
    ]);
    const users =
      enrollments.length || requests.length
        ? await this.db.getRepository(UserEntity).find({
            where: {
              id: In(
                [
                  ...enrollments.map((e) => e.userId),
                  ...requests.map((r) => r.userId),
                ].filter((x, i, all) => all.indexOf(x) === i),
              ),
            },
          })
        : [];
    const withUsers = <T extends { userId: number }>(rows: T[]) =>
      rows.map((r) => ({
        ...r,
        user: users.find((u) => u.id === r.userId) || null,
      }));
    return {
      turma: (await this.hydrate([turma]))[0],
      enrollments: withUsers(enrollments).map((e) =>
        this.enrollmentDto(e, turma),
      ),
      requests: withUsers(requests).map((r) => this.requestDto(r)),
      modules,
      config,
      canEditPolicy: this.isSuperAdmin(actor),
    };
  }
  async decide(
    actor: UserEntity,
    requestId: number,
    input: {
      status: "APPROVED" | "REJECTED";
      turmaId?: number | null;
      note: string;
    },
  ) {
    await this.requireSuperAdmin(actor);
    const request = await this.db
      .getRepository(TurmaRequestEntity)
      .findOneBy({ id: requestId });
    if (!request) throw new NotFoundException("Solicitação não encontrada.");
    if (request.status !== "PENDING")
      throw new BadRequestException("Esta solicitação já foi decidida.");
    let turmaId: number | null = request.turmaId;
    if (input.status === "APPROVED") {
      if (input.turmaId) {
        const selected = await this.byId(input.turmaId);
        if (selected.bookLevel !== request.bookLevel)
          throw new BadRequestException(
            "Selecione uma turma do livro indicado.",
          );
        turmaId = selected.id;
      } else if (turmaId) await this.byId(turmaId);
      else {
        const found = await this.nextTurmaForLevel(request.bookLevel);
        if (!found)
          throw new BadRequestException(
            "Crie a turma do Guerreiro " +
              request.bookLevel +
              " antes de aprovar.",
          );
        turmaId = found.id;
      }
    }
    await this.db.transaction(async (em) => {
      await em.save(TurmaRequestEntity, {
        ...request,
        status: input.status,
        turmaId,
        decisionNote: input.note,
        decidedById: actor.id,
        decidedAt: new Date(),
      });
      await this.audit(
        em,
        actor,
        "DECIDE_TURMA_REQUEST",
        String(request.id),
        input.status +
          " · Guerreiro " +
          request.bookLevel +
          " · " +
          request.name,
      );
    });
    const full = await this.db
      .getRepository(TurmaRequestEntity)
      .findOneBy({ id: requestId });
    return this.requestDto({
      ...(full as TurmaRequestEntity),
      turmaTitle: turmaId
        ? (await this.db.getRepository(TurmaEntity).findOneBy({ id: turmaId }))
            ?.title || null
        : null,
    });
  }
  async setEnrollment(
    actor: UserEntity,
    enrollmentId: number,
    status: "CONFIRMED" | "CANCELLED",
  ) {
    await this.requireSuperAdmin(actor);
    const enrollment = await this.db
      .getRepository(TurmaEnrollmentEntity)
      .findOneBy({ id: enrollmentId });
    if (!enrollment) throw new NotFoundException("Matrícula não encontrada.");
    enrollment.status = status;
    if (status === "CONFIRMED") {
      enrollment.confirmedAt = enrollment.confirmedAt || new Date();
      if (!enrollment.paymentRef)
        enrollment.paymentRef =
          "MAN-" + randomBytes(3).toString("hex").toUpperCase();
    }
    await this.db.getRepository(TurmaEnrollmentEntity).save(enrollment);
    await this.db.getRepository(AuditEntity).save({
      userId: actor.id,
      username: actor.username,
      action: "SET_TURMA_ENROLLMENT",
      object: String(enrollment.id),
      detail: status + " · matrícula",
      createdAt: new Date(),
    });
    const turma = await this.db
      .getRepository(TurmaEntity)
      .findOneBy({ id: enrollment.turmaId });
    return this.enrollmentDto(enrollment, turma || undefined);
  }
  async saveConfig(actor: UserEntity, turmaId: number, input: EnvConfigInput) {
    await this.requireSuperAdmin(actor);
    await this.byId(turmaId);
    const saved = await this.db.getRepository(TurmaEnvConfigEntity).save({
      turmaId,
      heroImageUrl: input.heroImageUrl,
      heroImageAlt: input.heroImageAlt,
      welcomeTitle: input.welcomeTitle,
      welcomeText: input.welcomeText,
      accent: input.accent,
      showRoster: input.showRoster,
      showSchedule: input.showSchedule,
      updatedAt: new Date(),
    });
    await this.db.getRepository(AuditEntity).save({
      userId: actor.id,
      username: actor.username,
      action: "SAVE_TURMA_ENV",
      object: String(turmaId),
      detail: "Configuração do ambiente atualizada",
      createdAt: new Date(),
    });
    return this.config(saved.turmaId);
  }
  async leaders() {
    const rows = await this.db
      .getRepository(TurmaLeaderEntity)
      .find({ order: { createdAt: "DESC" } });
    const ids = rows.map((r) => r.userId);
    const granterIds = rows
      .map((r) => r.grantedById)
      .filter((x): x is number => !!x);
    const [users, granters] = await Promise.all([
      ids.length
        ? this.db.getRepository(UserEntity).find({ where: { id: In(ids) } })
        : Promise.resolve([]),
      granterIds.length
        ? this.db
            .getRepository(UserEntity)
            .find({ where: { id: In(granterIds) } })
        : Promise.resolve([]),
    ]);
    return rows.map((r) => ({
      id: r.id,
      userId: r.userId,
      username: users.find((u) => u.id === r.userId)?.username || "usuário",
      grantedBy: r.grantedById
        ? granters.find((u) => u.id === r.grantedById)?.username || null
        : null,
      createdAt: r.createdAt.toISOString(),
    }));
  }
  async grantLeader(actor: UserEntity, username: string) {
    await this.requireSuperAdmin(actor);
    const user = await this.db
      .getRepository(UserEntity)
      .findOneBy({ username, active: true });
    if (!user) throw new NotFoundException("Usuário não encontrado.");
    if (
      await this.db
        .getRepository(TurmaLeaderEntity)
        .existsBy({ userId: user.id })
    )
      throw new ConflictException("Esta conta já é líder de turma.");
    const row = await this.db.getRepository(TurmaLeaderEntity).save({
      userId: user.id,
      grantedById: actor.id,
      createdAt: new Date(),
    });
    await this.db.getRepository(AuditEntity).save({
      userId: actor.id,
      username: actor.username,
      action: "GRANT_TURMA_LEADER",
      object: String(user.id),
      detail: "Privilégio de líder concedido a " + user.username,
      createdAt: new Date(),
    });
    return { id: row.id, userId: user.id, username: user.username };
  }
  async revokeLeader(actor: UserEntity, grantId: number) {
    await this.requireSuperAdmin(actor);
    const grant = await this.db
      .getRepository(TurmaLeaderEntity)
      .findOneBy({ id: grantId });
    if (!grant) throw new NotFoundException("Privilégio não encontrado.");
    await this.db.getRepository(TurmaLeaderEntity).delete({ id: grantId });
    await this.db.getRepository(AuditEntity).save({
      userId: actor.id,
      username: actor.username,
      action: "REVOKE_TURMA_LEADER",
      object: String(grant.userId),
      detail: "Privilégio de líder removido",
      createdAt: new Date(),
    });
    return { ok: true };
  }
  auditFromRequest(
    req: AuthRequest,
    action: string,
    object: string,
    detail: string,
  ) {
    return this.db.getRepository(AuditEntity).save({
      userId: req.actor?.id || null,
      username: req.actor?.username || "anônimo",
      action,
      object,
      detail,
      createdAt: new Date(),
    });
  }
}
