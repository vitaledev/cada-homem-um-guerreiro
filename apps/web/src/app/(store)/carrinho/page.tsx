import { CartView } from "@/components/cart";
export const metadata = {
  title: "Sua sacola",
  robots: { index: false, follow: false },
};
export default function CartPage() {
  return (
    <>
      <section className="page-intro">
        <p className="eyebrow dark">OS SEUS ESSENCIAIS</p>
        <h1>
          Sua <em>sacola.</em>
        </h1>
      </section>
      <CartView />
    </>
  );
}
