"use client";

import {
  ArrayField,
  Create,
  Datagrid,
  DateField,
  DeleteButton,
  Edit,
  EditButton,
  List,
  NumberField,
  NumberInput,
  Pagination,
  ReferenceField,
  ReferenceInput,
  ReferenceManyField,
  SearchInput,
  SelectField,
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
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import {
  COPY_STATUS_CHOICES,
  FORMAT_CHOICES,
  MetaDates,
  SectionTitle,
  StockField,
} from "@/components/admin/shared";
import { IsbnLookupButton } from "@/components/admin/IsbnLookupButton";
import { ServerExportButtons } from "@/components/admin/ServerExportButtons";

const bookFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Názov, ISBN…" />,
  <ReferenceInput key="author" source="authorId" reference="authors" alwaysOn>
    <SelectInput optionText="name" label="Autor" emptyText="Všetci autori" />
  </ReferenceInput>,
  <ReferenceInput key="category" source="categoryId" reference="categories">
    <SelectInput optionText="name" label="Kategória" emptyText="Všetky" />
  </ReferenceInput>,
  <SelectInput
    key="available"
    source="availableOnly"
    label="Dostupnosť"
    emptyText="Všetky"
    choices={[{ id: true, name: "Len dostupné" }]}
  />,
];

const ListActions = () => (
  <TopToolbar>
    <ServerExportButtons path="/api/books/export" fileStem="books" />
  </TopToolbar>
);

export const BookList = () => (
  <List
    sort={{ field: "title", order: "ASC" }}
    perPage={25}
    filters={bookFilters}
    actions={<ListActions />}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}
    title="Knihy"
  >
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField source="title" label="Názov" />
      <TextField source="author" label="Autor" />
      <TextField source="categoryName" label="Kategória" />
      <SelectField source="format" choices={FORMAT_CHOICES} label="Formát" />
      <StockField />
      <TextField source="shelfLocation" label="Polica" />
      <TextField source="isbn" label="ISBN" />
      <ShowButton />
      <EditButton />
    </Datagrid>
  </List>
);

function BookTitle() {
  const record = useRecordContext();
  return <span>{record?.title ? `Kniha · ${record.title}` : "Kniha"}</span>;
}

const BookForm = () => (
  <SimpleForm>
    <SectionTitle>Identita</SectionTitle>
    <TextInput source="title" validate={required()} fullWidth />
    <TextInput source="subtitle" fullWidth helperText="Voliteľný podtitul" />
    <ReferenceInput source="authorId" reference="authors" perPage={100}>
      <SelectInput optionText="name" validate={required()} fullWidth />
    </ReferenceInput>
    <ReferenceInput source="categoryId" reference="categories" perPage={100}>
      <SelectInput optionText="name" fullWidth emptyText="Bez kategórie" />
    </ReferenceInput>

    <SectionTitle>Vydanie</SectionTitle>
    <TextInput source="publisher" />
    <TextInput source="isbn" helperText="ISBN-10 alebo ISBN-13" />
    <IsbnLookupButton />
    <NumberInput source="publishedYear" label="Rok vydania" />
    <TextInput source="language" defaultValue="sk" />
    <SelectInput source="format" choices={FORMAT_CHOICES} defaultValue={0} />
    <NumberInput source="pageCount" label="Počet strán" min={0} />
    <TextInput
      source="coverUrl"
      label="Cover URL"
      fullWidth
      helperText="Open Library cover alebo vlastný URL"
    />

    <SectionTitle>Fond a umiestnenie</SectionTitle>
    <TextInput source="shelfLocation" label="Polica / trakt" />
    <NumberInput source="totalCopies" defaultValue={1} min={1} label="Celkom kusov" />
    <NumberInput
      source="availableCopies"
      defaultValue={1}
      min={0}
      label="Dostupných kusov"
    />

    <SectionTitle>Popis</SectionTitle>
    <TextInput source="description" multiline fullWidth rows={5} />
  </SimpleForm>
);

const ShowActions = () => (
  <TopToolbar>
    <EditButton />
    <DeleteButton mutationMode="pessimistic" />
  </TopToolbar>
);

export const BookShow = () => (
  <Show title={<BookTitle />} actions={<ShowActions />}>
    <SimpleShowLayout>
      <TextField source="title" label="Názov" />
      <TextField source="subtitle" label="Podtitul" emptyText="—" />
      <ReferenceField source="authorId" reference="authors" link="show" label="Autor">
        <TextField source="name" />
      </ReferenceField>
      <TextField source="author" label="Autor (meno)" />
      <ReferenceField
        source="categoryId"
        reference="categories"
        link="show"
        label="Kategória"
        emptyText="—"
      >
        <TextField source="name" />
      </ReferenceField>
      <SelectField source="format" choices={FORMAT_CHOICES} label="Formát" />
      <TextField source="publisher" emptyText="—" />
      <TextField source="isbn" emptyText="—" />
      <TextField source="coverUrl" label="Cover" emptyText="—" />
      <NumberField source="publishedYear" label="Rok" emptyText="—" />
      <TextField source="language" emptyText="—" />
      <NumberField source="pageCount" label="Strany" emptyText="—" />
      <TextField source="shelfLocation" label="Polica" emptyText="—" />
      <StockField />
      <TextField source="description" label="Popis" emptyText="—" />
      <Divider sx={{ my: 2 }} />
      <Typography variant="overline" color="text.secondary">
        Exempláre (inventár)
      </Typography>
      <ArrayField source="copies" label={false}>
        <Datagrid bulkActionButtons={false} rowClick={false}>
          <TextField source="inventoryNumber" label="Inventárne č." />
          <TextField source="barcode" label="Čiarový kód" emptyText="—" />
          <SelectField
            source="status"
            choices={COPY_STATUS_CHOICES}
            label="Stav"
          />
          <TextField source="shelfLocation" label="Polica" emptyText="—" />
        </Datagrid>
      </ArrayField>
      <Divider sx={{ my: 2 }} />
      <Typography variant="overline" color="text.secondary">
        Rezervácie
      </Typography>
      <ReferenceManyField
        reference="bookings"
        target="bookId"
        label={false}
        perPage={10}
        sort={{ field: "dueDate", order: "DESC" }}
      >
        <Datagrid bulkActionButtons={false} rowClick="show">
          <TextField source="borrowerName" label="Čitateľ" />
          <TextField source="borrowerEmail" label="E-mail" />
          <DateField source="dueDate" label="Termín" showTime />
        </Datagrid>
      </ReferenceManyField>
      <MetaDates />
    </SimpleShowLayout>
  </Show>
);

export const BookEdit = () => (
  <Edit title={<BookTitle />}>
    <BookForm />
  </Edit>
);

export const BookCreate = () => (
  <Create title="Nová kniha" redirect="show">
    <BookForm />
  </Create>
);
