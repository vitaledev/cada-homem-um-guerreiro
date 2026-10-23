import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { getCategories } from "@/lib/server";
export const dynamic = "force-dynamic";
export default async function StoreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const categories = await getCategories();
  return (
    <>
      <Header categories={categories} />
      <main id="conteudo">{children}</main>
      <Footer />
    </>
  );
}
