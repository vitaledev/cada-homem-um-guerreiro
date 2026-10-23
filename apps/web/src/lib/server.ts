import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import type {
  Category,
  Catalog,
  Product,
  Turma,
  TurmaEnvironment,
  TurmaOverview,
} from "@guerreiros/contracts";
const base = process.env.API_INTERNAL_URL || "http://127.0.0.1:4187";
export async function publicApi<T>(path: string): Promise<T> {
  const response = await fetch(base + "/api/v1/" + path, {
    cache: "no-store",
    signal: AbortSignal.timeout(10000),
  });
  if (!response.ok)
    throw new Error(response.status === 404 ? "NOT_FOUND" : "API_UNAVAILABLE");
  return response.json();
}
export async function authedApi<T>(path: string): Promise<T> {
  const store = await cookies();
  const session = store.get("guerreiros_session");
  const response = await fetch(base + "/api/v1/" + path, {
    cache: "no-store",
    headers: session ? { cookie: "guerreiros_session=" + session.value } : {},
    signal: AbortSignal.timeout(10000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(
      (data as { message?: string }).message ||
        (response.status === 404 ? "NOT_FOUND" : "API_UNAVAILABLE"),
    ) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }
  return data as T;
}
export const getCategories = cache(() =>
  publicApi<Category[]>("catalog/categories"),
);
export const getCatalog = (query = "") =>
  publicApi<Catalog>("catalog/products" + (query ? "?" + query : ""));
export const getProduct = (slug: string) =>
  publicApi<Product>("catalog/products/" + encodeURIComponent(slug));
export const getTurmas = () => publicApi<Turma[]>("turmas");
export const getTurma = (slug: string) =>
  publicApi<Turma>("turmas/" + encodeURIComponent(slug));
export const getTurmaEnvironment = (slug: string) =>
  authedApi<TurmaEnvironment>(
    "turmas/" + encodeURIComponent(slug) + "/ambiente",
  );
export const getTurmaOverview = () =>
  authedApi<TurmaOverview>("turmas/overview");
