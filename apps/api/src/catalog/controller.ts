import { Controller, Get, Param, Query } from "@nestjs/common";
import { CatalogService } from "./service";
@Controller("catalog")
export class CatalogController {
  constructor(private catalog: CatalogService) {}
  @Get("categories") categories() {
    return this.catalog.categories();
  }
  @Get("products") list(@Query() query: Record<string, string>) {
    return this.catalog.list(query);
  }
  @Get("products/:slug") one(@Param("slug") slug: string) {
    return this.catalog.one(slug);
  }
}
