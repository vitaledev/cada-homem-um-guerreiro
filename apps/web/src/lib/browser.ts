"use client";
import type { Session } from "@guerreiros/contracts";
let csrf = "";
export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
): Promise<T> {
  if (method !== "GET" && !csrf) await session();
  const form = body instanceof FormData;
  const response = await fetch("/api/v1/" + path, {
    method,
    credentials: "same-origin",
    cache: "no-store",
    headers: {
      ...(body && !form ? { "Content-Type": "application/json" } : {}),
      ...(method !== "GET" ? { "X-CSRF-Token": csrf } : {}),
    },
    body:
      body === undefined
        ? undefined
        : form
          ? (body as FormData)
          : JSON.stringify(body),
  });
  const data = await response
    .json()
    .catch(() => ({ message: "Falha de comunicação. Tente novamente." }));
  if (!response.ok)
    throw new Error(
      Array.isArray(data.message)
        ? data.message.join(", ")
        : data.message || "Não foi possível concluir.",
    );
  if (data.csrfToken) csrf = data.csrfToken;
  return data as T;
}
export async function session() {
  return api<Session>("session");
}
