import {
  Entity,
  Column,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
const dateType = process.env.DATABASE_URL ? "timestamptz" : "datetime";
@Entity("categories")
export class CategoryEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column() name: string;
  @Column({ unique: true }) slug: string;
  @Column({ default: 0 }) order: number;
}
@Entity("products")
export class ProductEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column() title: string;
  @Column({ unique: true }) slug: string;
  @Column({ unique: true }) sku: string;
  @Column() categoryId: number;
  @ManyToOne(() => CategoryEntity, { onDelete: "RESTRICT" })
  @JoinColumn({ name: "categoryId" })
  category: CategoryEntity;
  @Column({ default: "" }) subtitle: string;
  @Column("text") description: string;
  @Column() priceCents: number;
  @Column({ type: "integer", nullable: true }) comparePriceCents: number | null;
  @Column() imageUrl: string;
  @Column({ default: "" }) imageAlt: string;
  @Column({ default: 0 }) stock: number;
  @Column({ default: false }) active: boolean;
  @Column({ default: false }) featured: boolean;
  @Column({ default: false }) conceptual: boolean;
  @Column({ type: dateType }) createdAt: Date;
  @Column({ type: dateType }) updatedAt: Date;
}
@Entity("variants")
export class VariantEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column() productId: number;
  @ManyToOne(() => ProductEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: ProductEntity;
  @Column() name: string;
  @Column({ unique: true }) sku: string;
  @Column({ default: 0 }) stock: number;
  @Column({ type: "integer", nullable: true }) priceCents: number | null;
}
@Entity("gallery")
export class GalleryEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column() productId: number;
  @ManyToOne(() => ProductEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "productId" })
  product: ProductEntity;
  @Column() url: string;
  @Column() alt: string;
  @Column({ default: 0 }) order: number;
}
@Entity("users")
export class UserEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) username: string;
  @Column() passwordHash: string;
  @Column() role: string;
  @Column({ default: true }) active: boolean;
  @Column({ default: false }) canManageCatalog: boolean;
}
export type StoredCart = Record<
  string,
  { productId: number; variantId: number | null; quantity: number }
>;
@Entity("sessions")
export class SessionEntity {
  @PrimaryColumn() hash: string;
  @Column({ nullable: true, type: "integer" }) userId: number | null;
  @Column() csrf: string;
  @Column("simple-json") cart: StoredCart;
  @Column({ type: dateType }) expiresAt: Date;
}
@Entity("legacy_carts")
export class LegacyCartEntity {
  @PrimaryColumn() hash: string;
  @Column("simple-json") cart: StoredCart;
  @Column({ type: dateType }) expiresAt: Date;
}
@Entity("login_attempts")
export class LoginAttemptEntity {
  @PrimaryColumn() key: string;
  @Column() count: number;
  @Column({ type: dateType }) expiresAt: Date;
}
@Entity("audit")
export class AuditEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true, type: "integer" }) userId: number | null;
  @Column() username: string;
  @Column() action: string;
  @Column() object: string;
  @Column("text") detail: string;
  @Column({ type: dateType }) createdAt: Date;
}
@Entity("markers")
export class MarkerEntity {
  @PrimaryColumn() key: string;
}
@Entity("turmas")
export class TurmaEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column() bookLevel: number;
  @Column() title: string;
  @Column({ unique: true }) slug: string;
  @Column({ default: "" }) subtitle: string;
  @Column({ type: "text", default: "" }) description: string;
  @Column({ default: "DRAFT" }) status: string;
  @Column({ nullable: true, type: "integer" }) leaderUserId: number | null;
  @ManyToOne(() => UserEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "leaderUserId" })
  leader: UserEntity | null;
  @Column({ default: 0 }) priceCents: number;
  @Column({ default: 0 }) seatsTotal: number;
  @Column({ nullable: true, type: dateType }) startDate: Date | null;
  @Column({ default: "" }) imageUrl: string;
  @Column({ default: "" }) imageAlt: string;
  @Column({ type: dateType }) createdAt: Date;
  @Column({ type: dateType }) updatedAt: Date;
}
@Entity("turma_items")
export class TurmaItemEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column() turmaId: number;
  @ManyToOne(() => TurmaEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "turmaId" })
  turma: TurmaEntity;
  @Column() name: string;
  @Column({ default: "" }) description: string;
  @Column({ type: "integer", nullable: true }) priceCents: number | null;
  @Column({ default: true }) required: boolean;
  @Column({ default: 0 }) order: number;
}
@Entity("turma_requests")
export class TurmaRequestEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true, type: "integer" }) turmaId: number | null;
  @ManyToOne(() => TurmaEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "turmaId" })
  turma: TurmaEntity | null;
  @Column() bookLevel: number;
  @Column() userId: number;
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UserEntity;
  @Column() name: string;
  @Column() contact: string;
  @Column({ type: "text", default: "" }) message: string;
  @Column({ default: "PENDING" }) status: string;
  @Column({ nullable: true, type: "integer" }) decidedById: number | null;
  @ManyToOne(() => UserEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "decidedById" })
  decidedBy: UserEntity | null;
  @Column({ type: "text", default: "" }) decisionNote: string;
  @Column({ type: dateType }) createdAt: Date;
  @Column({ nullable: true, type: dateType }) decidedAt: Date | null;
}
@Entity("turma_enrollments")
export class TurmaEnrollmentEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column() turmaId: number;
  @ManyToOne(() => TurmaEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "turmaId" })
  turma: TurmaEntity;
  @Column() userId: number;
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UserEntity;
  @Column({ nullable: true, type: "integer" }) requestId: number | null;
  @ManyToOne(() => TurmaRequestEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "requestId" })
  request: TurmaRequestEntity | null;
  @Column({ default: "RESERVED" }) status: string;
  @Column({ default: "" }) paymentRef: string;
  @Column({ type: dateType }) createdAt: Date;
  @Column({ nullable: true, type: dateType }) confirmedAt: Date | null;
}
@Entity("turma_modules")
export class TurmaModuleEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column() turmaId: number;
  @ManyToOne(() => TurmaEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "turmaId" })
  turma: TurmaEntity;
  @Column() title: string;
  @Column({ default: "" }) summary: string;
  @Column({ default: 0 }) order: number;
  @Column({ default: "DRAFT" }) status: string;
  @Column({ nullable: true, type: "integer" }) createdById: number | null;
  @Column({ type: dateType }) updatedAt: Date;
}
@Entity("turma_lessons")
export class TurmaLessonEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column() moduleId: number;
  @ManyToOne(() => TurmaModuleEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "moduleId" })
  module: TurmaModuleEntity;
  @Column() turmaId: number;
  @ManyToOne(() => TurmaEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "turmaId" })
  turma: TurmaEntity;
  @Column() title: string;
  @Column({ default: "" }) summary: string;
  @Column({ type: "text", default: "" }) content: string;
  @Column({ default: "" }) attachmentUrl: string;
  @Column({ default: "" }) attachmentLabel: string;
  @Column({ default: 0 }) order: number;
  @Column({ default: "DRAFT" }) status: string;
  @Column({ type: dateType }) updatedAt: Date;
}
@Entity("turma_env_config")
export class TurmaEnvConfigEntity {
  @PrimaryColumn() turmaId: number;
  @ManyToOne(() => TurmaEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "turmaId" })
  turma: TurmaEntity;
  @Column({ default: "" }) heroImageUrl: string;
  @Column({ default: "" }) heroImageAlt: string;
  @Column({ default: "" }) welcomeTitle: string;
  @Column({ type: "text", default: "" }) welcomeText: string;
  @Column({ default: "cyan" }) accent: string;
  @Column({ default: false }) showRoster: boolean;
  @Column({ default: true }) showSchedule: boolean;
  @Column({ type: dateType }) updatedAt: Date;
}
@Entity("turma_leaders")
export class TurmaLeaderEntity {
  @PrimaryGeneratedColumn() id: number;
  @Column({ unique: true }) userId: number;
  @ManyToOne(() => UserEntity, { onDelete: "CASCADE" })
  @JoinColumn({ name: "userId" })
  user: UserEntity;
  @Column({ nullable: true, type: "integer" }) grantedById: number | null;
  @ManyToOne(() => UserEntity, { onDelete: "SET NULL" })
  @JoinColumn({ name: "grantedById" })
  grantedBy: UserEntity | null;
  @Column({ type: dateType }) createdAt: Date;
}
export const entities = [
  CategoryEntity,
  ProductEntity,
  VariantEntity,
  GalleryEntity,
  UserEntity,
  SessionEntity,
  LegacyCartEntity,
  LoginAttemptEntity,
  AuditEntity,
  MarkerEntity,
  TurmaEntity,
  TurmaItemEntity,
  TurmaRequestEntity,
  TurmaEnrollmentEntity,
  TurmaModuleEntity,
  TurmaLessonEntity,
  TurmaEnvConfigEntity,
  TurmaLeaderEntity,
];
