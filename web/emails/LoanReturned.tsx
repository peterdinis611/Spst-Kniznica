import { Button, Section, Text } from "@react-email/components";
import {
  SpstEmailLayout,
  emailStyles as s,
} from "./_components/SpstEmailLayout";

export type LoanReturnedProps = {
  borrowerName?: string;
  bookTitle?: string;
  returnedAt?: string;
  catalogUrl?: string;
};

/** Sent when a loan is marked returned. */
export default function LoanReturned({
  borrowerName = "{{BorrowerName}}",
  bookTitle = "{{BookTitle}}",
  returnedAt = "{{ReturnedAt}}",
  catalogUrl = "{{CatalogUrl}}",
}: LoanReturnedProps) {
  return (
    <SpstEmailLayout
      preview={`Vrátené: ${bookTitle}`}
      catalogUrl={catalogUrl}
    >
      <Text style={s.greeting}>Ahoj {borrowerName},</Text>
      <Text style={s.title}>Ďakujeme za vrátenie</Text>
      <Text style={s.body}>
        Titul je opäť v knižničnom fonde. Ak hľadáš ďalšie čítanie, katalóg je
        vždy otvorený.
      </Text>
      <Section style={s.meta}>
        <Text style={s.metaLabel}>Titul</Text>
        <Text style={s.metaValue}>{bookTitle}</Text>
        <Text style={s.metaLabel}>Vrátené</Text>
        <Text style={{ ...s.metaValue, marginBottom: 0 }}>{returnedAt}</Text>
      </Section>
      <Button href={catalogUrl} style={s.cta}>
        Prehliadať katalóg
      </Button>
    </SpstEmailLayout>
  );
}
