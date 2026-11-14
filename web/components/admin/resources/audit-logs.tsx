"use client";

import {
  Datagrid,
  DateField,
  ExportButton,
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

const ACTION_CHOICES = [
  { id: "book.create", name: "book.create" },
  { id: "book.update", name: "book.update" },
  { id: "book.delete", name: "book.delete" },
  { id: "book.import", name: "book.import" },
  { id: "booking.update", name: "booking.update" },
  { id: "booking.delete", name: "booking.delete" },
  { id: "booking.cancel", name: "booking.cancel" },
  { id: "booking.renew", name: "booking.renew" },
];

const ENTITY_CHOICES = [
  { id: "Book", name: "Book" },
  { id: "Booking", name: "Booking" },
];

const SOURCE_CHOICES = [
  { id: "BookService", name: "BookService" },
  { id: "BookingService", name: "BookingService" },
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
    <ExportButton />
  </TopToolbar>
);

export const AuditLogList = () => (
  <List
    sort={{ field: "occurredAt", order: "DESC" }}
    perPage={25}
    filters={auditFilters}
    actions={<ListActions />}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50, 100]} />}
    title="Audit logy"
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
      <TextField source="entityId" label="Entity ID" />
      <TextField source="actorName" label="Aktér" emptyText="—" />
      <TextField source="actorEmail" label="E-mail" emptyText="—" />
      <TextField source="actorIdHash" label="Actor hash" emptyText="—" />
      <TextField source="roles" label="Role" emptyText="—" />
      <TextField source="sourceService" label="Zdrojová služba" emptyText="—" />
      <Typography variant="overline" color="text.secondary" sx={{ mt: 2 }}>
        Details JSON
      </Typography>
      <DetailsJsonField />
    </SimpleShowLayout>
  </Show>
);
