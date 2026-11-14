"use client";

import {
  BooleanInput,
  Create,
  Datagrid,
  DeleteButton,
  Edit,
  EditButton,
  List,
  NumberField,
  NumberInput,
  Pagination,
  ReferenceManyField,
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
import Divider from "@mui/material/Divider";
import Typography from "@mui/material/Typography";
import {
  ACTIVE_CHOICES,
  ActiveChipField,
  MetaDates,
  SectionTitle,
  StockField,
} from "@/components/admin/shared";
import { ServerExportButtons } from "@/components/admin/ServerExportButtons";

const authorFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Meno autora…" />,
  <SelectInput
    key="active"
    source="isActive"
    label="Stav"
    choices={ACTIVE_CHOICES}
    emptyText="Všetci"
  />,
];

const ListActions = () => (
  <TopToolbar>
    <ServerExportButtons path="/api/authors/export" fileStem="authors" />
  </TopToolbar>
);

export const AuthorList = () => (
  <List
    sort={{ field: "name", order: "ASC" }}
    perPage={25}
    filters={authorFilters}
    actions={<ListActions />}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}
    title="Autori"
  >
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField source="name" label="Meno" />
      <TextField source="nationality" label="Národnosť" emptyText="—" />
      <NumberField source="birthYear" label="Narodenie" emptyText="—" />
      <ActiveChipField />
      <ShowButton />
      <EditButton />
    </Datagrid>
  </List>
);

function AuthorTitle() {
  const record = useRecordContext();
  return <span>{record?.name ? `Autor · ${record.name}` : "Autor"}</span>;
}

const AuthorForm = () => (
  <SimpleForm>
    <SectionTitle>Profil</SectionTitle>
    <TextInput source="name" validate={required()} fullWidth />
    <TextInput source="nationality" label="Národnosť" />
    <NumberInput source="birthYear" label="Rok narodenia" min={1000} max={2100} />
    <BooleanInput source="isActive" label="Aktívny v katalógu" defaultValue />

    <SectionTitle>Biografia</SectionTitle>
    <TextInput
      source="biography"
      multiline
      fullWidth
      rows={6}
      helperText="Krátky text pre detail autora vo fronte"
    />
  </SimpleForm>
);

const ShowActions = () => (
  <TopToolbar>
    <EditButton />
    <DeleteButton mutationMode="pessimistic" />
  </TopToolbar>
);

export const AuthorShow = () => (
  <Show title={<AuthorTitle />} actions={<ShowActions />}>
    <SimpleShowLayout>
      <TextField source="name" label="Meno" />
      <TextField source="nationality" label="Národnosť" emptyText="—" />
      <NumberField source="birthYear" label="Narodenie" emptyText="—" />
      <ActiveChipField />
      <TextField source="biography" label="Biografia" emptyText="—" />
      <Divider sx={{ my: 2 }} />
      <Typography variant="overline" color="text.secondary">
        Tituly autora
      </Typography>
      <ReferenceManyField
        reference="books"
        target="authorId"
        label={false}
        perPage={25}
        sort={{ field: "title", order: "ASC" }}
      >
        <Datagrid bulkActionButtons={false} rowClick="show">
          <TextField source="title" label="Názov" />
          <TextField source="categoryName" label="Kategória" emptyText="—" />
          <StockField />
          <TextField source="shelfLocation" label="Polica" emptyText="—" />
        </Datagrid>
      </ReferenceManyField>
      <MetaDates />
    </SimpleShowLayout>
  </Show>
);

export const AuthorEdit = () => (
  <Edit title={<AuthorTitle />}>
    <AuthorForm />
  </Edit>
);

export const AuthorCreate = () => (
  <Create title="Nový autor" redirect="show">
    <AuthorForm />
  </Create>
);
