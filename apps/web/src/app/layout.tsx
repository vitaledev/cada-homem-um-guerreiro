import type { Metadata } from "next";
import { SessionProvider } from "@/components/session";
import "./store.css";
import "./admin.css";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: {
    default: "Cada Homem Um Guerreiro · Equipe sua jornada",
    template: "%s · Guerreiros",
  },
  description:
    "Livros, vestuário e essenciais para uma vida com fé, propósito e coragem.",
  icons: {
    icon: "/static/design/favicons/favicon.svg",
    apple: "/static/design/favicons/favicon-180.png",
  },
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
