import type { TurmaLevel } from "@guerreiros/contracts";

/** Capa de cada livro da coleção, usada como imagem padrão das turmas. */
export const BOOK_COVERS: Record<TurmaLevel, string> = {
  1: "/static/design/mockups/catalogo-referencia/livro-guerreiro-1.webp",
  2: "/static/design/mockups/catalogo-referencia/livro-guerreiro-2.webp",
  3: "/static/design/mockups/catalogo-referencia/livro-guerreiro-3.webp",
  4: "/static/design/logos/simbolo-escuro.svg",
};

export const DEFAULT_TURMA_IMAGE = "/static/design/logos/simbolo-escuro.svg";

/** Retorna a imagem própria da turma ou, sem uma definida, a capa do livro. */
export function turmaCover(level: TurmaLevel, imageUrl: string): string {
  if (imageUrl && imageUrl !== DEFAULT_TURMA_IMAGE) return imageUrl;
  return BOOK_COVERS[level] || DEFAULT_TURMA_IMAGE;
}

/** Indica se a imagem ainda é a padrão (símbolo ou capa automática do livro). */
export function isAutoCover(imageUrl: string): boolean {
  return (
    !imageUrl ||
    imageUrl === DEFAULT_TURMA_IMAGE ||
    Object.values(BOOK_COVERS).includes(imageUrl)
  );
}
