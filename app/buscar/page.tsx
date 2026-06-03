import { AppShell } from "@/components/AppShell";
import { BuscaUI } from "./BuscaUI";

export const dynamic = "force-dynamic";

export default function BuscarPage() {
  return (
    <AppShell>
      <BuscaUI />
    </AppShell>
  );
}
