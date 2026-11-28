import { Button, Section, Text } from "@react-email/components";
import {
  SpstEmailLayout,
  emailStyles as s,
} from "./_components/SpstEmailLayout";

export type LoanDueReminderProps = {
  borrowerName?: string;
  bookTitle?: string;
  dueDate?: string;
  myLibraryUrl?: string;
};

export default function LoanDueReminder({
  borrowerName = "{{BorrowerName}}",
  bookTitle = "{{BookTitle}}",
  dueDate = "{{DueDate}}",
  myLibraryUrl = "{{MyLibraryUrl}}",
}: LoanDueReminderProps) {
  return (
    <SpstEmailLayout
      preview={`Pripomienka: vráť „${bookTitle}“ do ${dueDate}`}
      myLibraryUrl={myLibraryUrl}
    >
      <Text style={s.greeting}>Ahoj {borrowerName},</Text>
      <Text style={s.title}>Blíži sa termín vrátenia</Text>
      <Text style={s.body}>
        Pripomíname termín vrátenia požičanej knihy. Ak potrebuješ predĺženie,
        požiadaj oň v Mojej knižnici (ak to politika knižnice dovolí).
      </Text>
      <Section style={s.meta}>
        <Text style={s.metaLabel}>Titul</Text>
        <Text style={s.metaValue}>{bookTitle}</Text>
        <Text style={s.metaLabel}>Vrátiť do</Text>
        <Text style={{ ...s.metaValue, marginBottom: 0 }}>{dueDate}</Text>
      </Section>
      <Button href={myLibraryUrl} style={s.cta}>
        Spravovať výpožičku
      </Button>
    </SpstEmailLayout>
  );
}
