import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  UseGuards,
  Inject,
  ParseIntPipe,
  BadRequestException,
  NotFoundException,
} from "@nestjs/common";
import { DataSource, EntityManager, In } from "typeorm";
import { productSchema, categorySchema } from "@guerreiros/contracts";
import { DB } from "../database/source";
import {
  ProductEntity,
  CategoryEntity,
  VariantEntity,
  GalleryEntity,
  AuditEntity,
} from "../database/entities";
import { SessionGuard, AdminGuard, AuthRequest } from "../auth/session";
import { CatalogService } from "../catalog/service";
@Controller("admin")
@UseGuards(SessionGuard, AdminGuard)
export class AdminController {
  constructor(
    @Inject(DB) private db: DataSource,
    private catalog: CatalogService,
  ) {}
  @Get("products") list(@Query() query: Record<string, string>) {
    return this.catalog.list(query, true);
  }
  @Get("products/:id") one(@Param("id", ParseIntPipe) id: number) {
    return this.catalog.byId(id, true);
  }
  @Post("products") create(@Body() body: unknown, @Req() req: AuthRequest) {
    return this.save(null, body, req);
  }
  @Patch("products/:id") update(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    return this.save(id, body, req);
  }
  async save(id: number | null, body: unknown, req: AuthRequest) {
    const input = productSchema.parse(body);
    if (
      !(await this.db
        .getRepository(CategoryEntity)
        .existsBy({ id: input.categoryId }))
    )
      throw new BadRequestException("Categoria inválida.");
    const { variants, gallery, ...fields } = input;
    let savedId = 0;
    await this.db.transaction(async (em) => {
      const previous = id ? await em.findOneBy(ProductEntity, { id }) : null;
      if (id && !previous)
        throw new NotFoundException("Produto não encontrado.");
      for (const v of variants) {
        if (
          v.id &&
          (!id ||
            !(await em.existsBy(VariantEntity, { id: v.id, productId: id })))
        )
          throw new BadRequestException("Variação de outro produto.");
      }
      for (const image of gallery) {
        if (
          image.id &&
          (!id ||
            !(await em.existsBy(GalleryEntity, {
              id: image.id,
              productId: id,
            })))
        )
          throw new BadRequestException("Imagem de outro produto.");
      }
      const p = await em.save(
        ProductEntity,
        em.create(ProductEntity, {
          ...previous,
          ...fields,
          createdAt: previous?.createdAt || new Date(),
          updatedAt: new Date(),
        }),
      );
      savedId = p.id;
      const existingVariants = await em.findBy(VariantEntity, {
        productId: p.id,
      });
      const removedVariants = existingVariants.filter(
        (v) => !variants.some((item) => item.id === v.id),
      );
      if (removedVariants.length)
        await em.delete(VariantEntity, {
          id: In(removedVariants.map((v) => v.id)),
        });
      for (const v of variants)
        await em.save(
          VariantEntity,
          em.create(VariantEntity, { ...v, productId: p.id }),
        );
      const existingImages = await em.findBy(GalleryEntity, {
        productId: p.id,
      });
      const removedImages = existingImages.filter(
        (g) => !gallery.some((item) => item.id === g.id),
      );
      if (removedImages.length)
        await em.delete(GalleryEntity, {
          id: In(removedImages.map((g) => g.id)),
        });
      for (const image of gallery)
        await em.save(
          GalleryEntity,
          em.create(GalleryEntity, { ...image, productId: p.id }),
        );
      await this.audit(
        em,
        req,
        id ? "UPDATE_PRODUCT" : "CREATE_PRODUCT",
        String(p.id),
        p.title,
      );
    });
    return this.catalog.byId(savedId, true);
  }
  @Delete("products/:id") async remove(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    await this.db.transaction(async (em) => {
      const p = await em.findOneBy(ProductEntity, { id });
      if (!p) throw new NotFoundException();
      await em.delete(ProductEntity, { id });
      await this.audit(em, req, "DELETE_PRODUCT", String(id), p.title);
    });
    return { ok: true };
  }
  @Get("categories") categories() {
    return this.catalog.categories();
  }
  @Post("categories") async categoryCreate(
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    return this.categorySave(null, body, req);
  }
  @Patch("categories/:id") async categoryUpdate(
    @Param("id", ParseIntPipe) id: number,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    return this.categorySave(id, body, req);
  }
  async categorySave(id: number | null, body: unknown, req: AuthRequest) {
    const data = categorySchema.parse(body);
    return this.db.transaction(async (em) => {
      if (id && !(await em.existsBy(CategoryEntity, { id })))
        throw new NotFoundException();
      const c = await em.save(CategoryEntity, {
        ...data,
        ...(id ? { id } : {}),
      });
      await this.audit(em, req, "SAVE_CATEGORY", String(c.id), c.name);
      return c;
    });
  }
  @Delete("categories/:id") async categoryDelete(
    @Param("id", ParseIntPipe) id: number,
    @Req() req: AuthRequest,
  ) {
    await this.db.transaction(async (em) => {
      if (await em.existsBy(ProductEntity, { categoryId: id }))
        throw new BadRequestException(
          "A categoria contém produtos. Reclassifique-os antes de excluir.",
        );
      await em.delete(CategoryEntity, { id });
      await this.audit(
        em,
        req,
        "DELETE_CATEGORY",
        String(id),
        "Categoria excluída",
      );
    });
    return { ok: true };
  }
  @Get("audit") async history() {
    return this.db
      .getRepository(AuditEntity)
      .find({ order: { createdAt: "DESC" }, take: 100 });
  }
  audit(
    em: EntityManager,
    req: AuthRequest,
    action: string,
    object: string,
    detail: string,
  ) {
    return em.save(AuditEntity, {
      userId: req.actor!.id,
      username: req.actor!.username,
      action,
      object,
      detail,
      createdAt: new Date(),
    });
  }
}
