import { Button, Section, Text } from "@react-email/components";
import {
  SpstEmailLayout,
  emailStyles as s,
} from "./_components/SpstEmailLayout";

export type LoanBorrowedProps = {
  borrowerName?: string;
  bookTitle?: string;
  dueDate?: string;
  borrowedAt?: string;
  myLibraryUrl?: string;
};

/** Sent when staff checks out a reservation (pôžička vydaná). */
export default function LoanBorrowed({
  borrowerName = "{{BorrowerName}}",
  bookTitle = "{{BookTitle}}",
  dueDate = "{{DueDate}}",
  borrowedAt = "{{BorrowedAt}}",
  myLibraryUrl = "{{MyLibraryUrl}}",
}: LoanBorrowedProps) {
  return (
    <SpstEmailLayout
      preview={`Požičané: ${bookTitle} — vráť do ${dueDate}`}
      myLibraryUrl={myLibraryUrl}
    >
      <Text style={s.greeting}>Ahoj {borrowerName},</Text>
      <Text style={s.title}>Kniha je požičaná</Text>
      <Text style={s.body}>
        Vyzvihol si / vyzvihla si titul z knižnice SPST. Prosím, vráť ho včas —
        termín a detaily nájdeš aj v Mojej knižnici.
      </Text>
      <Section style={s.meta}>
        <Text style={s.metaLabel}>Titul</Text>
        <Text style={s.metaValue}>{bookTitle}</Text>
        <Text style={s.metaLabel}>Vydané</Text>
        <Text style={s.metaValue}>{borrowedAt}</Text>
        <Text style={s.metaLabel}>Vrátiť do</Text>
        <Text style={{ ...s.metaValue, marginBottom: 0 }}>{dueDate}</Text>
      </Section>
      <Button href={myLibraryUrl} style={s.cta}>
        Otvoriť Moju knižnicu
      </Button>
    </SpstEmailLayout>
  );
}
