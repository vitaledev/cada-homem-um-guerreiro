import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { DB } from "../database/source";
import {
  ProductEntity,
  VariantEntity,
  GalleryEntity,
  CategoryEntity,
} from "../database/entities";
import { Product } from "@guerreiros/contracts";
@Injectable()
export class CatalogService {
  constructor(@Inject(DB) public db: DataSource) {}
  categories() {
    return this.db
      .getRepository(CategoryEntity)
      .find({ order: { order: "ASC", name: "ASC" } });
  }
  async hydrate(rows: ProductEntity[]): Promise<Product[]> {
    if (!rows.length) return [];
    const ids = rows.map((r) => r.id);
    const [categories, variants, gallery] = await Promise.all([
      this.categories(),
      this.db.getRepository(VariantEntity).findBy({ productId: In(ids) }),
      this.db.getRepository(GalleryEntity).find({
        where: { productId: In(ids) },
        order: { order: "ASC", id: "ASC" },
      }),
    ]);
    return rows.map((p) => ({
      ...p,
      category: categories.find((c) => c.id === p.categoryId)!,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
      variants: variants
        .filter((v) => v.productId === p.id)
        .map(({ id, name, sku, stock, priceCents }) => ({
          id,
          name,
          sku,
          stock,
          priceCents,
        })),
      gallery: gallery
        .filter((g) => g.productId === p.id)
        .map(({ id, url, alt, order }) => ({ id, url, alt, order })),
    }));
  }
  async list(query: Record<string, string>, admin = false) {
    const qb = this.db.getRepository(ProductEntity).createQueryBuilder("p");
    if (!admin) qb.where("p.active = :active", { active: true });
    if (query.q) {
      qb.andWhere(
        "(LOWER(p.title) LIKE :q OR LOWER(p.description) LIKE :q OR LOWER(p.sku) LIKE :q)",
        { q: "%" + query.q.slice(0, 100).toLowerCase() + "%" },
      );
    }
    if (query.categoria) {
      qb.andWhere(
        "p.categoryId IN (SELECT c.id FROM categories c WHERE c.slug = :slug)",
        { slug: query.categoria.slice(0, 100) },
      );
    }
    if (query.featured === "true")
      qb.andWhere("p.featured = :featured", { featured: true });
    const sort: Record<string, [string, "ASC" | "DESC"]> = {
      "menor-preco": ["p.priceCents", "ASC"],
      "maior-preco": ["p.priceCents", "DESC"],
      nome: ["p.title", "ASC"],
    };
    const [field, dir] = sort[query.ordem] || ["p.createdAt", "DESC"];
    qb.orderBy(field, dir).addOrderBy("p.id", "DESC");
    const page = Math.max(1, Math.min(Number(query.pagina) || 1, 10000));
    const limit = Math.max(1, Math.min(Number(query.limit) || 24, 100));
    const [rows, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();
    return {
      items: await this.hydrate(rows),
      total,
      page,
      pages: Math.max(1, Math.ceil(total / limit)),
    };
  }
  async one(slug: string, admin = false) {
    const row = await this.db
      .getRepository(ProductEntity)
      .findOneBy(admin ? { slug } : { slug, active: true });
    if (!row) throw new NotFoundException("Produto não encontrado.");
    return (await this.hydrate([row]))[0];
  }
  async byId(id: number, admin = false) {
    const row = await this.db
      .getRepository(ProductEntity)
      .findOneBy(admin ? { id } : { id, active: true });
    if (!row) throw new NotFoundException("Produto não encontrado.");
    return (await this.hydrate([row]))[0];
  }
}
