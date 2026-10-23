import {
  Module,
  Global,
  Inject,
  Injectable,
  OnApplicationShutdown,
} from "@nestjs/common";
import { DataSource } from "typeorm";
import { DB, createSource } from "./database/source";
import { Sessions, SessionGuard, AdminGuard } from "./auth/session";
import { AuthController } from "./auth/controller";
import { CatalogService } from "./catalog/service";
import { CatalogController } from "./catalog/controller";
import { CartController } from "./cart/controller";
import { AdminController } from "./admin/controller";
import { MediaController } from "./media/controller";
import { TurmasService } from "./turmas/service";
import { TurmasController, TurmaAdminController } from "./turmas/controller";
@Injectable()
class DatabaseLifecycle implements OnApplicationShutdown {
  constructor(@Inject(DB) private db: DataSource) {}
  async onApplicationShutdown() {
    if (this.db.isInitialized) await this.db.destroy();
  }
}
@Global()
@Module({
  providers: [
    { provide: DB, useFactory: async () => createSource().initialize() },
    DatabaseLifecycle,
  ],
  exports: [DB],
})
export class DatabaseModule {}
@Global()
@Module({
  providers: [Sessions, SessionGuard, AdminGuard],
  controllers: [AuthController],
  exports: [Sessions, SessionGuard, AdminGuard],
})
export class AuthModule {}
@Module({
  providers: [CatalogService],
  controllers: [CatalogController],
  exports: [CatalogService],
})
export class CatalogModule {}
@Module({ imports: [CatalogModule], controllers: [CartController] })
export class CartModule {}
@Module({ imports: [CatalogModule], controllers: [AdminController] })
export class AdminModule {}
@Module({ controllers: [MediaController] })
export class MediaModule {}
@Module({
  providers: [TurmasService],
  controllers: [TurmasController, TurmaAdminController],
  exports: [TurmasService],
})
export class TurmasModule {}
