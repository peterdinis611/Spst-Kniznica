import {
  HttpStatusPageShell,
  HttpStatusPanel,
} from "@/components/routing/HttpStatusPanel";

export default function NotFound() {
  return (
    <HttpStatusPageShell>
      <HttpStatusPanel code={404} />
    </HttpStatusPageShell>
  );
}
