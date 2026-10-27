import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Req,
  UseGuards,
  BadRequestException,
  ConflictException,
} from "@nestjs/common";
import { cartAddSchema, cartUpdateSchema, Cart } from "@guerreiros/contracts";
import { SessionGuard, Sessions, AuthRequest } from "../auth/session";
import { CatalogService } from "../catalog/service";
@Controller("cart")
@UseGuards(SessionGuard)
export class CartController {
  constructor(
    private sessions: Sessions,
    private catalog: CatalogService,
  ) {}
  @Get() async get(@Req() req: AuthRequest): Promise<Cart> {
    const items = [];
    for (const [key, line] of Object.entries(req.session.cart)) {
      const p = await this.catalog.byId(line.productId).catch(() => null);
      if (!p) continue;
      const v = line.variantId
        ? p.variants.find((v) => v.id === line.variantId)
        : null;
      if (line.variantId && !v) continue;
      const priceCents = v?.priceCents ?? p.priceCents;
      const stock = v?.stock ?? p.stock;
      items.push({
        key,
        product: p,
        variant: v || null,
        quantity: line.quantity,
        priceCents,
        subtotalCents: line.quantity * priceCents,
        stock,
        unavailable: line.quantity > stock,
      });
    }
    return {
      items,
      totalCents: items.reduce((n, i) => n + i.subtotalCents, 0),
      count: items.reduce((n, i) => n + i.quantity, 0),
    };
  }
  @Post() async add(@Body() body: unknown, @Req() req: AuthRequest) {
    const data = cartAddSchema.parse(body);
    const p = await this.catalog.byId(data.productId);
    if (p.category.slug === "livros")
      throw new ConflictException(
        "Livros devem ser comprados na loja oficial da RTM.",
      );
    const v = data.variantId
      ? p.variants.find((v) => v.id === data.variantId)
      : null;
    if (p.variants.length && !v)
      throw new BadRequestException("Selecione uma variação válida.");
    if (data.variantId && !v)
      throw new BadRequestException("Variação inválida para este produto.");
    const key = `${p.id}:${v?.id || 0}`;
    const quantity = (req.session.cart[key]?.quantity || 0) + data.quantity;
    if (quantity > Math.min(20, v?.stock ?? p.stock))
      throw new BadRequestException("Quantidade indisponível.");
    if (!req.session.cart[key] && Object.keys(req.session.cart).length >= 50)
      throw new BadRequestException("Limite de 50 itens diferentes.");
    req.session.cart[key] = {
      productId: p.id,
      variantId: v?.id || null,
      quantity,
    };
    await this.sessions.save(req.session);
    return this.get(req);
  }
  @Patch(":key") async update(
    @Param("key") key: string,
    @Body() body: unknown,
    @Req() req: AuthRequest,
  ) {
    const { quantity } = cartUpdateSchema.parse(body);
    const line = req.session.cart[key];
    if (!line) throw new BadRequestException("Item não encontrado.");
    const p = await this.catalog.byId(line.productId);
    const v = line.variantId
      ? p.variants.find((v) => v.id === line.variantId)
      : null;
    if (line.variantId && !v)
      throw new BadRequestException("Variação não disponível.");
    if (quantity > (v?.stock ?? p.stock))
      throw new BadRequestException("Quantidade indisponível.");
    line.quantity = quantity;
    await this.sessions.save(req.session);
    return this.get(req);
  }
  @Delete(":key") async remove(
    @Param("key") key: string,
    @Req() req: AuthRequest,
  ) {
    delete req.session.cart[key];
    await this.sessions.save(req.session);
    return this.get(req);
  }
}
