import { AdminApp } from "@/components/admin";
import "@/app/turmas.css";
export const metadata = {
  title: "Gestão",
  robots: { index: false, follow: false },
};
export default function AdminPage() {
  return <AdminApp />;
}
