import { Button, Section, Text } from "@react-email/components";
import {
  SpstEmailLayout,
  emailStyles as s,
} from "./_components/SpstEmailLayout";

export type WaitlistReadyProps = {
  borrowerName?: string;
  bookTitle?: string;
  dueDate?: string;
  myLibraryUrl?: string;
};

export default function WaitlistReady({
  borrowerName = "{{BorrowerName}}",
  bookTitle = "{{BookTitle}}",
  dueDate = "{{DueDate}}",
  myLibraryUrl = "{{MyLibraryUrl}}",
}: WaitlistReadyProps) {
  return (
    <SpstEmailLayout
      preview={`Pripravené na vyzdvihnutie: ${bookTitle}`}
      myLibraryUrl={myLibraryUrl}
    >
      <Text style={s.greeting}>Ahoj {borrowerName},</Text>
      <Text style={s.title}>Kniha je pripravená</Text>
      <Text style={s.body}>
        Titul z čakacieho zoznamu je pre teba rezervovaný. Vyzdvihni ho v
        knižnici SPST do uvedeného termínu, inak rezervácia môže prepadnúť
        ďalšiemu záujemcovi.
      </Text>
      <Section style={s.meta}>
        <Text style={s.metaLabel}>Titul</Text>
        <Text style={s.metaValue}>{bookTitle}</Text>
        <Text style={s.metaLabel}>Vyzdvihnúť do</Text>
        <Text style={{ ...s.metaValue, marginBottom: 0 }}>{dueDate}</Text>
      </Section>
      <Button href={myLibraryUrl} style={s.cta}>
        Detail rezervácie
      </Button>
    </SpstEmailLayout>
  );
}
