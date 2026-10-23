import {
  TURMA_STATUS_LABEL,
  TURMA_ENROLLMENT_LABEL,
} from "@guerreiros/contracts";

/** Data por extenso para exibição nas páginas das turmas (usável no servidor). */
export const when = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      })
    : "A definir";

export function StatusChip({ status }: { status: string }) {
  const tone =
    status === "CONFIRMED" || status === "APPROVED" || status === "PUBLISHED"
      ? "ok"
      : status === "PENDING" || status === "RESERVED" || status === "OPEN"
        ? "wait"
        : status === "REJECTED" || status === "CANCELLED"
          ? "bad"
          : "";
  const label =
    TURMA_STATUS_LABEL[status as keyof typeof TURMA_STATUS_LABEL] ||
    TURMA_ENROLLMENT_LABEL[status as keyof typeof TURMA_ENROLLMENT_LABEL] ||
    (status === "DRAFT"
      ? "Rascunho"
      : status === "PUBLISHED"
        ? "Publicado"
        : status);
  return <span className={"chip " + tone}>{label}</span>;
}
