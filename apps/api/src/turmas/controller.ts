import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
  BadRequestException,
  ForbiddenException,
} from "@nestjs/common";
import {
  interestSchema,
  lessonSchema,
  moduleSchema,
  requestDecisionSchema,
  enrollmentDecisionSchema,
  envConfigSchema,
  leaderGrantSchema,
  TurmaInput,
  turmaSchema,
} from "@guerreiros/contracts";
import { SessionGuard, AuthRequest } from "../auth/session";
import { TurmasService } from "./service";

@Controller("turmas")
@UseGuards(SessionGuard)
export class TurmasController {
  constructor(private turmas: TurmasService) {}
  @Get()
  list() {
    return this.turmas.listPublic();
  }
  @Get("overview")
  async overview(@Req() req: AuthRequest) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acompanhar as suas turmas.");
    return this.turmas.overview(req.actor);
  }
  @Get("manageable")
  async manageable(@Req() req: AuthRequest) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar a gestão.");
    await this.turmas.requireLeader(req.actor);
    return this.turmas.manageables(req.actor);
  }
  @Get(":slug")
  one(@Param("slug") slug: string) {
    return this.turmas.one(slug);
  }
  @Get(":slug/ambiente")
  async environment(@Param("slug") slug: string, @Req() req: AuthRequest) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar o ambiente da turma.");
    return this.turmas.environment(req.actor, slug);
  }
  @Get(":id/staff")
  async staff(@Param("id", ParseIntPipe) id: number, @Req() req: AuthRequest) {
    if (!req.actor)
      throw new ForbiddenException("Entre para gerenciar a turma.");
    return this.turmas.staffView(req.actor, id);
  }
  @Post("interest")
  async interest(@Body() body: unknown, @Req() req: AuthRequest) {
    if (!req.actor)
      throw new ForbiddenException(
        "Entre com a sua conta para manifestar interesse.",
      );
    return this.turmas.createInterest(req.actor, interestSchema.parse(body));
  }
  @Post()
  async create(@Body() body: unknown, @Req() req: AuthRequest) {
    if (!req.actor) throw new ForbiddenException("Entre para criar uma turma.");
    return this.save(null, body, req);
  }
  @Patch(":id")
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor) throw new ForbiddenException("Entre para editar a turma.");
    return this.save(id, body, req);
  }
  async save(id: number | null, body: unknown, req: AuthRequest) {
    const input: TurmaInput = turmaSchema.parse(body);
    return this.turmas.saveTurma(id, input, req.actor!);
  }
  @Post(":id/enroll")
  async enroll(@Param("id", ParseIntPipe) id: number, @Req() req: AuthRequest) {
    throw new ForbiddenException(
      "A matrícula e a compra dos materiais são conduzidas pela administração da turma.",
    );
  }
  @Post(":id/checkout")
  async checkout(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    throw new ForbiddenException(
      "A compra e o envio dos materiais são conduzidos pela administração da turma.",
    );
  }
  @Post(":id/modules")
  async moduleCreate(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor)
      throw new ForbiddenException("Entre para editar o conteúdo.");
    return this.turmas.saveModule(
      id,
      null,
      moduleSchema.parse(body),
      req.actor,
    );
  }
  @Patch(":id/modules/:moduleId")
  async moduleUpdate(
    @Param("id", ParseIntPipe) id: number,
    @Param("moduleId", ParseIntPipe) moduleId: number,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor)
      throw new ForbiddenException("Entre para editar o conteúdo.");
    return this.turmas.saveModule(
      id,
      moduleId,
      moduleSchema.parse(body),
      req.actor,
    );
  }
  @Delete(":id/modules/:moduleId")
  async moduleDelete(
    @Param("id", ParseIntPipe) id: number,
    @Param("moduleId", ParseIntPipe) moduleId: number,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor)
      throw new ForbiddenException("Entre para editar o conteúdo.");
    return this.turmas.deleteModule(id, moduleId, req.actor);
  }
  @Post(":id/modules/:moduleId/lessons")
  async lessonCreate(
    @Param("id", ParseIntPipe) id: number,
    @Param("moduleId", ParseIntPipe) moduleId: number,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor)
      throw new ForbiddenException("Entre para editar o conteúdo.");
    return this.turmas.saveLesson(
      id,
      moduleId,
      null,
      lessonSchema.parse(body),
      req.actor,
    );
  }
  @Patch(":id/modules/:moduleId/lessons/:lessonId")
  async lessonUpdate(
    @Param("id", ParseIntPipe) id: number,
    @Param("moduleId", ParseIntPipe) moduleId: number,
    @Param("lessonId", ParseIntPipe) lessonId: number,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor)
      throw new ForbiddenException("Entre para editar o conteúdo.");
    return this.turmas.saveLesson(
      id,
      moduleId,
      lessonId,
      lessonSchema.parse(body),
      req.actor,
    );
  }
  @Delete(":id/modules/:moduleId/lessons/:lessonId")
  async lessonDelete(
    @Param("id", ParseIntPipe) id: number,
    @Param("lessonId", ParseIntPipe) lessonId: number,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor)
      throw new ForbiddenException("Entre para editar o conteúdo.");
    return this.turmas.deleteLesson(id, lessonId, req.actor);
  }
}

@Controller("admin/turmas")
@UseGuards(SessionGuard)
export class TurmaAdminController {
  constructor(private turmas: TurmasService) {}
  @Get()
  async list(@Req() req: AuthRequest) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar a gestão.");
    await this.turmas.requireSuperAdmin(req.actor);
    return this.turmas.manageables(req.actor);
  }
  @Get("requests")
  async requests(
    @Query() query: Record<string, string>,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar a gestão.");
    await this.turmas.requireSuperAdmin(req.actor);
    return this.turmas.allRequests(query);
  }
  @Get("enrollments")
  async enrollments(
    @Query() query: Record<string, string>,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar a gestão.");
    await this.turmas.requireSuperAdmin(req.actor);
    return this.turmas.allEnrollments(query);
  }
  @Get("leaders")
  async leaders(@Req() req: AuthRequest) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar a gestão.");
    await this.turmas.requireSuperAdmin(req.actor);
    return this.turmas.leaders();
  }
  @Post("leaders")
  async grant(@Body() body: unknown, @Req() req: AuthRequest) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar a gestão.");
    const input = leaderGrantSchema.parse(body);
    return this.turmas.grantLeader(req.actor, input.username);
  }
  @Delete("leaders/:id")
  async revoke(@Param("id", ParseIntPipe) id: number, @Req() req: AuthRequest) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar a gestão.");
    return this.turmas.revokeLeader(req.actor, id);
  }
  @Patch("requests/:id")
  async decide(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar a gestão.");
    const input = requestDecisionSchema.parse(body);
    if (input.status === "REJECTED" && !input.note.trim())
      throw new BadRequestException(
        "Explique o motivo da recusa para o interessado.",
      );
    return this.turmas.decide(req.actor, id, {
      status: input.status,
      turmaId: input.turmaId ?? null,
      note: input.note,
    });
  }
  @Patch("enrollments/:id")
  async enrollment(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar a gestão.");
    const input = enrollmentDecisionSchema.parse(body);
    return this.turmas.setEnrollment(req.actor, id, input.status);
  }
  @Put(":id/config")
  async config(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar a gestão.");
    return this.turmas.saveConfig(req.actor, id, envConfigSchema.parse(body));
  }
  @Delete(":id")
  async remove(@Param("id", ParseIntPipe) id: number, @Req() req: AuthRequest) {
    if (!req.actor)
      throw new ForbiddenException("Entre para acessar a gestão.");
    return this.turmas.deleteTurma(id, req.actor);
  }
}
