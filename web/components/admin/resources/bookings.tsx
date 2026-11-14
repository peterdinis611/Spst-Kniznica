"use client";

import {
  Create,
  Datagrid,
  DateField,
  DateTimeInput,
  DeleteButton,
  Edit,
  EditButton,
  EmailField,
  List,
  Pagination,
  ReferenceField,
  ReferenceInput,
  SearchInput,
  SelectInput,
  Show,
  ShowButton,
  SimpleForm,
  SimpleShowLayout,
  TextField,
  TextInput,
  TopToolbar,
  required,
  useRecordContext,
} from "react-admin";
import { BookingQuickActions } from "@/components/admin/BookingQuickActions";
import {
  BOOKING_STATUS_CHOICES,
  BookingStatusField,
  MetaDates,
  SectionTitle,
} from "@/components/admin/shared";
import { ServerExportButtons } from "@/components/admin/ServerExportButtons";

const bookingFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Meno / e-mail…" />,
  <SelectInput
    key="status"
    source="status"
    label="Stav"
    choices={BOOKING_STATUS_CHOICES}
    emptyText="Všetky stavy"
    alwaysOn
  />,
  <ReferenceInput key="book" source="bookId" reference="books">
    <SelectInput optionText="title" label="Kniha" emptyText="Všetky knihy" />
  </ReferenceInput>,
];

const ListActions = () => (
  <TopToolbar>
    <ServerExportButtons path="/api/bookings/export" fileStem="bookings" />
  </TopToolbar>
);

export const BookingList = () => (
  <List
    sort={{ field: "dueDate", order: "ASC" }}
    perPage={25}
    filters={bookingFilters}
    actions={<ListActions />}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}
    title="Rezervácie"
  >
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <ReferenceField source="bookId" reference="books" link="show" label="Kniha">
        <TextField source="title" />
      </ReferenceField>
      <TextField source="borrowerName" label="Čitateľ" />
      <EmailField source="borrowerEmail" label="E-mail" />
      <BookingStatusField />
      <DateField source="dueDate" label="Termín" showTime />
      <BookingQuickActions />
      <ShowButton />
      <EditButton />
    </Datagrid>
  </List>
);

function BookingTitle() {
  const record = useRecordContext();
  if (!record) return <span>Rezervácia</span>;
  return <span>Rezervácia · {record.borrowerName}</span>;
}

const BookingForm = () => (
  <SimpleForm>
    <SectionTitle>Titul</SectionTitle>
    <ReferenceInput source="bookId" reference="books" perPage={100}>
      <SelectInput optionText="title" validate={required()} fullWidth />
    </ReferenceInput>

    <SectionTitle>Čitateľ</SectionTitle>
    <TextInput source="borrowerName" validate={required()} fullWidth label="Meno" />
    <TextInput
      source="borrowerEmail"
      validate={required()}
      fullWidth
      label="E-mail"
      type="email"
    />

    <SectionTitle>Stav výpožičky</SectionTitle>
    <SelectInput
      source="status"
      choices={BOOKING_STATUS_CHOICES}
      defaultValue={0}
      validate={required()}
      fullWidth
    />
    <DateTimeInput source="dueDate" validate={required()} label="Termín vrátenia" />
    <TextInput source="notes" multiline fullWidth rows={4} label="Poznámka" />
  </SimpleForm>
);

const ShowActions = () => (
  <TopToolbar>
    <EditButton />
    <DeleteButton mutationMode="pessimistic" />
  </TopToolbar>
);

export const BookingShow = () => (
  <Show title={<BookingTitle />} actions={<ShowActions />}>
    <SimpleShowLayout>
      <ReferenceField source="bookId" reference="books" link="show" label="Kniha">
        <TextField source="title" />
      </ReferenceField>
      <TextField source="borrowerName" label="Čitateľ" />
      <EmailField source="borrowerEmail" label="E-mail" />
      <BookingStatusField />
      <BookingQuickActions />
      <DateField source="dueDate" label="Termín" showTime />
      <DateField source="reservedAt" label="Rezervované" showTime emptyText="—" />
      <DateField source="borrowedAt" label="Vydané" showTime emptyText="—" />
      <DateField source="returnedAt" label="Vrátené" showTime emptyText="—" />
      <TextField source="bookCopyId" label="Exemplár ID" emptyText="—" />
      <TextField source="notes" label="Poznámka" emptyText="—" />
      <MetaDates />
    </SimpleShowLayout>
  </Show>
);

export const BookingEdit = () => (
  <Edit title={<BookingTitle />}>
    <BookingForm />
  </Edit>
);

export const BookingCreate = () => (
  <Create title="Nová rezervácia" redirect="show">
    <BookingForm />
  </Create>
);
