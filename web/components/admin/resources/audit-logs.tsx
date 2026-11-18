"use client";

import {
  Datagrid,
  DateField,
  List,
  Pagination,
  SearchInput,
  SelectInput,
  Show,
  SimpleShowLayout,
  TextField,
  TopToolbar,
  useRecordContext,
} from "react-admin";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import { ServerExportButtons } from "@/components/admin/ServerExportButtons";

const ACTION_CHOICES = [
  { id: "book.create", name: "book.create" },
  { id: "book.update", name: "book.update" },
  { id: "book.delete", name: "book.delete" },
  { id: "book.import", name: "book.import" },
  { id: "book.export", name: "book.export" },
  { id: "book.copy.status", name: "book.copy.status" },
  { id: "author.create", name: "author.create" },
  { id: "author.update", name: "author.update" },
  { id: "author.delete", name: "author.delete" },
  { id: "author.export", name: "author.export" },
  { id: "category.create", name: "category.create" },
  { id: "category.update", name: "category.update" },
  { id: "category.delete", name: "category.delete" },
  { id: "category.export", name: "category.export" },
  { id: "booking.create", name: "booking.create" },
  { id: "booking.update", name: "booking.update" },
  { id: "booking.delete", name: "booking.delete" },
  { id: "booking.cancel", name: "booking.cancel" },
  { id: "booking.renew", name: "booking.renew" },
  { id: "booking.export", name: "booking.export" },
  { id: "booking.desk.export", name: "booking.desk.export" },
  { id: "booking.policy.update", name: "booking.policy.update" },
  { id: "booking.waitlist.join", name: "booking.waitlist.join" },
  { id: "booking.waitlist.leave", name: "booking.waitlist.leave" },
  { id: "booking.favorite.add", name: "booking.favorite.add" },
  { id: "booking.favorite.remove", name: "booking.favorite.remove" },
  { id: "booking.lifecycle.mark-overdue", name: "booking.lifecycle.mark-overdue" },
  { id: "booking.lifecycle.due-reminders", name: "booking.lifecycle.due-reminders" },
  { id: "auth.settings.update", name: "auth.settings.update" },
  { id: "email.send", name: "email.send" },
  { id: "email.failed", name: "email.failed" },
  { id: "email.template.loan-due-reminder", name: "email.template.loan-due-reminder" },
  {
    id: "email.template.waitlist-promotion",
    name: "email.template.waitlist-promotion",
  },
  { id: "cache.set", name: "cache.set" },
  { id: "cache.remove", name: "cache.remove" },
  { id: "cache.remove.prefix", name: "cache.remove.prefix" },
  { id: "messaging.publish", name: "messaging.publish" },
  { id: "order.enqueue", name: "order.enqueue" },
  { id: "audit.export", name: "audit.export" },
];

const ENTITY_CHOICES = [
  { id: "Book", name: "Book" },
  { id: "BookCopy", name: "BookCopy" },
  { id: "Author", name: "Author" },
  { id: "Category", name: "Category" },
  { id: "Booking", name: "Booking" },
  { id: "WaitlistEntry", name: "WaitlistEntry" },
  { id: "FavoriteBook", name: "FavoriteBook" },
  { id: "LoanPolicy", name: "LoanPolicy" },
  { id: "AuthSettings", name: "AuthSettings" },
  { id: "EmailMessage", name: "EmailMessage" },
  { id: "CacheKey", name: "CacheKey" },
  { id: "PingEvent", name: "PingEvent" },
  { id: "OrderJob", name: "OrderJob" },
  { id: "AuditLog", name: "AuditLog" },
];

const SOURCE_CHOICES = [
  { id: "BookService", name: "BookService" },
  { id: "AuthorService", name: "AuthorService" },
  { id: "CategoryService", name: "CategoryService" },
  { id: "BookingService", name: "BookingService" },
  { id: "AuthService", name: "AuthService" },
  { id: "EmailService", name: "EmailService" },
  { id: "CacheService", name: "CacheService" },
  { id: "MessagingService", name: "MessagingService" },
  { id: "WorkersService", name: "WorkersService" },
  { id: "AdminService", name: "AdminService" },
];

const auditFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Akcia, entita, email…" />,
  <SelectInput
    key="action"
    source="action"
    label="Akcia"
    choices={ACTION_CHOICES}
    emptyText="Všetky akcie"
  />,
  <SelectInput
    key="entityType"
    source="entityType"
    label="Entita"
    choices={ENTITY_CHOICES}
    emptyText="Všetky"
  />,
  <SelectInput
    key="source"
    source="sourceService"
    label="Služba"
    choices={SOURCE_CHOICES}
    emptyText="Všetky"
  />,
];

const ListActions = () => (
  <TopToolbar>
    <ServerExportButtons
      path="/api/admin/audit-logs/export"
      fileStem="audit-logs"
    />
  </TopToolbar>
);

export const AuditLogList = () => (
  <List
    sort={{ field: "occurredAt", order: "DESC" }}
    perPage={25}
    filters={auditFilters}
    actions={<ListActions />}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
    title="Záznamy auditu"
  >
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <DateField source="occurredAt" label="Čas" showTime />
      <TextField source="action" label="Akcia" />
      <TextField source="entityType" label="Entita" />
      <TextField source="entityId" label="ID" />
      <TextField source="actorName" label="Aktér" emptyText="—" />
      <TextField source="actorEmail" label="E-mail" emptyText="—" />
      <TextField source="sourceService" label="Služba" emptyText="—" />
    </Datagrid>
  </List>
);

function AuditTitle() {
  const record = useRecordContext();
  if (!record) return <span>Audit</span>;
  return (
    <span>
      Audit · {record.action} · {String(record.entityId).slice(0, 8)}
    </span>
  );
}

function DetailsJsonField() {
  const record = useRecordContext();
  const raw = record?.detailsJson as string | undefined;
  if (!raw) {
    return (
      <Typography variant="body2" color="text.secondary">
        —
      </Typography>
    );
  }

  let pretty = raw;
  try {
    pretty = JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    // keep raw
  }

  return (
    <Box
      component="pre"
      sx={{
        m: 0,
        p: 2,
        overflow: "auto",
        fontFamily: "var(--font-mono-family)",
        fontSize: 12,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "action.hover",
      }}
    >
      {pretty}
    </Box>
  );
}

export const AuditLogShow = () => (
  <Show title={<AuditTitle />}>
    <SimpleShowLayout>
      <DateField source="occurredAt" label="Čas" showTime />
      <TextField source="action" label="Akcia" />
      <TextField source="entityType" label="Entita" />
      <TextField source="entityId" label="ID entity" />
      <TextField source="actorName" label="Aktér" emptyText="—" />
      <TextField source="actorEmail" label="E-mail" emptyText="—" />
      <TextField source="actorIdHash" label="Hash aktéra" emptyText="—" />
      <TextField source="roles" label="Role" emptyText="—" />
      <TextField source="sourceService" label="Zdrojová služba" emptyText="—" />
      <Typography variant="overline" color="text.secondary" sx={{ mt: 2 }}>
        Details JSON
      </Typography>
      <DetailsJsonField />
    </SimpleShowLayout>
  </Show>
);
