export const RTM_BOOKS_URL = "https://loja.rtmbrasil.org.br/livros";

export function officialBookUrl(slug: string) {
  if (/^cada-homem-um-guerreiro-livro-[1-4]$/.test(slug)) {
    return `${RTM_BOOKS_URL}/${slug}`;
  }
  return RTM_BOOKS_URL;
}

export function isBook(categorySlug: string) {
  return categorySlug === "livros";
}
