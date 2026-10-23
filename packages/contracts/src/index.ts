import { z } from "zod";
export type Category = {
  id: number;
  name: string;
  slug: string;
  order: number;
};
export type Variant = {
  id: number;
  name: string;
  sku: string;
  stock: number;
  priceCents: number | null;
};
export type GalleryImage = {
  id: number;
  url: string;
  alt: string;
  order: number;
};
export type Product = {
  id: number;
  title: string;
  slug: string;
  sku: string;
  categoryId: number;
  category: Category;
  subtitle: string;
  description: string;
  priceCents: number;
  comparePriceCents: number | null;
  imageUrl: string;
  imageAlt: string;
  stock: number;
  active: boolean;
  featured: boolean;
  conceptual: boolean;
  createdAt: string;
  updatedAt: string;
  variants: Variant[];
  gallery: GalleryImage[];
};
export type Role = "ADMIN" | "EDITOR" | "CUSTOMER";
export type User = {
  id: number;
  username: string;
  role: Role;
  canManage: boolean;
  leader: boolean;
};
export type CartLine = {
  key: string;
  product: Product;
  variant: Variant | null;
  quantity: number;
  priceCents: number;
  subtotalCents: number;
  stock: number;
  unavailable: boolean;
};
export type Cart = { items: CartLine[]; totalCents: number; count: number };
export type Session = {
  csrfToken: string;
  user: User | null;
  cartCount: number;
};
export type Catalog = {
  items: Product[];
  total: number;
  page: number;
  pages: number;
};
const localImage = z
  .string()
  .max(300)
  .refine(
    (v) =>
      /^\/(static\/design|media\/produtos)\/[a-zA-Z0-9_.\/-]+$/.test(v) &&
      !v.includes(".."),
    "Use uma imagem local enviada pela gestão.",
  );
const money = z.number().int().min(1).max(999999999);
const stock = z.number().int().min(0).max(1000000);
export const categorySchema = z
  .object({
    name: z.string().trim().min(1).max(80),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(100),
    order: z.number().int().min(0).max(999),
  })
  .strict();
export const productSchema = z
  .object({
    title: z.string().trim().min(1).max(160),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      .max(180),
    sku: z.string().trim().min(1).max(64),
    categoryId: z.number().int().positive(),
    subtitle: z.string().max(160),
    description: z.string().min(1).max(20000),
    priceCents: money,
    comparePriceCents: money.nullable(),
    imageUrl: localImage,
    imageAlt: z.string().max(180),
    stock,
    active: z.boolean(),
    featured: z.boolean(),
    conceptual: z.boolean(),
    variants: z
      .array(
        z
          .object({
            id: z.number().int().positive().optional(),
            name: z.string().min(1).max(100),
            sku: z.string().min(1).max(80),
            stock,
            priceCents: money.nullable(),
          })
          .strict(),
      )
      .max(100),
    gallery: z
      .array(
        z
          .object({
            id: z.number().int().positive().optional(),
            url: localImage,
            alt: z.string().min(1).max(180),
            order: z.number().int().min(0).max(999),
          })
          .strict(),
      )
      .max(20),
  })
  .strict()
  .superRefine((v, c) => {
    if (v.comparePriceCents !== null && v.comparePriceCents <= v.priceCents)
      c.addIssue({
        code: "custom",
        path: ["comparePriceCents"],
        message: "O preço anterior deve ser maior que o atual.",
      });
    if (new Set(v.variants.map((x) => x.sku)).size !== v.variants.length)
      c.addIssue({
        code: "custom",
        path: ["variants"],
        message: "Os SKUs das variações devem ser únicos.",
      });
  });
export type ProductInput = z.infer<typeof productSchema>;
export const loginSchema = z
  .object({
    username: z.string().trim().min(1).max(150),
    password: z.string().min(1).max(200),
  })
  .strict();
export const cartAddSchema = z
  .object({
    productId: z.number().int().positive(),
    variantId: z.number().int().positive().nullable().optional(),
    quantity: z.number().int().min(1).max(20),
  })
  .strict();
export const cartUpdateSchema = z
  .object({ quantity: z.number().int().min(1).max(20) })
  .strict();
export const registerSchema = z
  .object({
    username: z
      .string()
      .trim()
      .regex(
        /^[-\w.@+]{3,150}$/,
        "Use de 3 a 150 caracteres: letras, números, ponto, @, +, _ ou -.",
      )
      .max(150),
    password: z.string().min(8).max(200),
  })
  .strict();
export type TurmaLevel = 1 | 2 | 3 | 4;
export type TurmaStatus =
  "DRAFT" | "OPEN" | "CONFIRMED" | "FINISHED" | "CANCELLED";
export type TurmaRequestStatus =
  "PENDING" | "APPROVED" | "REJECTED" | "CONVERTED";
export type TurmaEnrollmentStatus = "RESERVED" | "CONFIRMED" | "CANCELLED";
export type TurmaContentStatus = "DRAFT" | "PUBLISHED";
export const TURMA_LEVELS: TurmaLevel[] = [1, 2, 3, 4];
export const TURMA_STATUS_LABEL: Record<TurmaStatus, string> = {
  DRAFT: "Rascunho",
  OPEN: "Inscrições abertas",
  CONFIRMED: "Turma confirmada",
  FINISHED: "Encerrada",
  CANCELLED: "Cancelada",
};
export const TURMA_REQUEST_LABEL: Record<TurmaRequestStatus, string> = {
  PENDING: "Em análise",
  APPROVED: "Aprovada",
  REJECTED: "Não aprovada",
  CONVERTED: "Matriculado",
};
export const TURMA_ENROLLMENT_LABEL: Record<TurmaEnrollmentStatus, string> = {
  RESERVED: "Aguardando pagamento",
  CONFIRMED: "Matrícula confirmada",
  CANCELLED: "Cancelada",
};
export type TurmaItem = {
  id: number;
  turmaId: number;
  name: string;
  description: string;
  priceCents: number | null;
  required: boolean;
  order: number;
};
export type Turma = {
  id: number;
  bookLevel: TurmaLevel;
  title: string;
  slug: string;
  subtitle: string;
  description: string;
  status: TurmaStatus;
  leaderUserId: number | null;
  leaderUsername: string | null;
  priceCents: number;
  seatsTotal: number;
  seatsTaken: number;
  startDate: string | null;
  imageUrl: string;
  imageAlt: string;
  interestCount: number;
  createdAt: string;
  updatedAt: string;
  items: TurmaItem[];
};
export type TurmaRequest = {
  id: number;
  turmaId: number | null;
  turmaTitle: string | null;
  bookLevel: TurmaLevel;
  userId: number;
  username: string;
  name: string;
  contact: string;
  message: string;
  status: TurmaRequestStatus;
  decisionNote: string;
  decidedBy: string | null;
  createdAt: string;
  decidedAt: string | null;
};
export type TurmaEnrollment = {
  id: number;
  turmaId: number;
  turmaTitle: string;
  turmaSlug: string;
  bookLevel: TurmaLevel;
  userId: number;
  username: string;
  status: TurmaEnrollmentStatus;
  paymentRef: string;
  createdAt: string;
  confirmedAt: string | null;
};
export type TurmaLesson = {
  id: number;
  moduleId: number;
  title: string;
  summary: string;
  content: string;
  attachmentUrl: string;
  attachmentLabel: string;
  order: number;
  status: TurmaContentStatus;
  updatedAt: string;
};
export type TurmaModule = {
  id: number;
  turmaId: number;
  title: string;
  summary: string;
  order: number;
  status: TurmaContentStatus;
  updatedAt: string;
  lessons: TurmaLesson[];
};
export type TurmaEnvConfig = {
  turmaId: number;
  heroImageUrl: string;
  heroImageAlt: string;
  welcomeTitle: string;
  welcomeText: string;
  accent: "cyan" | "deep";
  showRoster: boolean;
  showSchedule: boolean;
  updatedAt: string;
};
export type TurmaEnvironment = {
  turma: Turma;
  config: TurmaEnvConfig;
  modules: TurmaModule[];
  roster: Array<{ username: string; since: string }>;
  role: "ADMIN" | "LEADER" | "STUDENT";
};
export type TurmaOverview = {
  requests: TurmaRequest[];
  enrollments: TurmaEnrollment[];
  ledTurmas: Turma[];
  isLeader: boolean;
};
export type TurmaLeaderGrant = {
  id: number;
  userId: number;
  username: string;
  grantedBy: string | null;
  createdAt: string;
};
const level = z.number().int().min(1).max(4);
const slugField = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  .max(180);
const attachment = z
  .string()
  .max(300)
  .refine((v) => {
    if (v === "") return true;
    if (/^\/(static\/design|media\/produtos)\/[a-zA-Z0-9_.\/-]+$/.test(v))
      return true;
    try {
      return new URL(v).protocol === "https:";
    } catch {
      return false;
    }
  }, "Use um arquivo local enviado pela gestão ou um endereço HTTPS.");
export const interestSchema = z
  .object({
    bookLevel: level,
    turmaId: z.number().int().positive().nullable().optional(),
    name: z.string().trim().min(2).max(120),
    contact: z.string().trim().min(5).max(160),
    message: z.string().trim().max(2000),
  })
  .strict();
export type InterestInput = z.infer<typeof interestSchema>;
const turmaItemSchema = z
  .object({
    id: z.number().int().positive().optional(),
    name: z.string().trim().min(1).max(120),
    description: z.string().max(400),
    priceCents: money.nullable(),
    required: z.boolean(),
    order: z.number().int().min(0).max(999),
  })
  .strict();
export const turmaSchema = z
  .object({
    bookLevel: level,
    title: z.string().trim().min(1).max(120),
    slug: slugField,
    subtitle: z.string().max(160),
    description: z.string().max(20000),
    status: z.enum(["DRAFT", "OPEN", "CONFIRMED", "FINISHED", "CANCELLED"]),
    leaderUserId: z.number().int().positive().nullable(),
    priceCents: z.number().int().min(0).max(999999999),
    seatsTotal: z.number().int().min(0).max(10000),
    startDate: z.iso.datetime().nullable(),
    imageUrl: localImage,
    imageAlt: z.string().max(180),
    items: z.array(turmaItemSchema).max(30),
  })
  .strict();
export type TurmaInput = z.infer<typeof turmaSchema>;
export const requestDecisionSchema = z
  .object({
    status: z.enum(["APPROVED", "REJECTED"]),
    turmaId: z.number().int().positive().nullable().optional(),
    note: z.string().trim().max(500),
  })
  .strict();
export const enrollmentDecisionSchema = z
  .object({ status: z.enum(["CONFIRMED", "CANCELLED"]) })
  .strict();
export const moduleSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    summary: z.string().max(300),
    order: z.number().int().min(0).max(999),
    status: z.enum(["DRAFT", "PUBLISHED"]),
  })
  .strict();
export type ModuleInput = z.infer<typeof moduleSchema>;
export const lessonSchema = z
  .object({
    title: z.string().trim().min(1).max(120),
    summary: z.string().max(300),
    content: z.string().max(20000),
    attachmentUrl: attachment,
    attachmentLabel: z.string().max(120),
    order: z.number().int().min(0).max(999),
    status: z.enum(["DRAFT", "PUBLISHED"]),
  })
  .strict();
export type LessonInput = z.infer<typeof lessonSchema>;
export const envConfigSchema = z
  .object({
    heroImageUrl: localImage,
    heroImageAlt: z.string().max(180),
    welcomeTitle: z.string().trim().max(120),
    welcomeText: z.string().max(4000),
    accent: z.enum(["cyan", "deep"]),
    showRoster: z.boolean(),
    showSchedule: z.boolean(),
  })
  .strict();
export type EnvConfigInput = z.infer<typeof envConfigSchema>;
export const leaderGrantSchema = z
  .object({ username: z.string().trim().min(1).max(150) })
  .strict();
