"use client";

import {
  BooleanInput,
  Create,
  Datagrid,
  DeleteButton,
  Edit,
  EditButton,
  ExportButton,
  List,
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
  ColorSwatchField,
  MetaDates,
  SectionTitle,
  StockField,
} from "@/components/admin/shared";

const categoryFilters = [
  <SearchInput key="q" source="q" alwaysOn placeholder="Názov kategórie…" />,
  <SelectInput
    key="active"
    source="isActive"
    label="Stav"
    choices={ACTIVE_CHOICES}
    emptyText="Všetky"
  />,
];

const ListActions = () => (
  <TopToolbar>
    <ExportButton />
  </TopToolbar>
);

export const CategoryList = () => (
  <List
    sort={{ field: "name", order: "ASC" }}
    perPage={25}
    filters={categoryFilters}
    actions={<ListActions />}
    pagination={<Pagination rowsPerPageOptions={[10, 25, 50]} />}
    title="Kategórie"
  >
    <Datagrid rowClick="show" bulkActionButtons={false}>
      <TextField source="name" label="Názov" />
      <TextField source="description" label="Popis" emptyText="—" />
      <ColorSwatchField />
      <ActiveChipField />
      <ShowButton />
      <EditButton />
    </Datagrid>
  </List>
);

function CategoryTitle() {
  const record = useRecordContext();
  return (
    <span>{record?.name ? `Kategória · ${record.name}` : "Kategória"}</span>
  );
}

const CategoryForm = () => (
  <SimpleForm>
    <SectionTitle>Rada</SectionTitle>
    <TextInput source="name" validate={required()} fullWidth />
    <TextInput
      source="description"
      multiline
      fullWidth
      rows={4}
      helperText="Popis pre katalóg a detail kategórie"
    />
    <TextInput
      source="color"
      label="Farba"
      helperText="CSS farba, napr. #4d7356"
      placeholder="#4d7356"
    />
    <BooleanInput source="isActive" label="Aktívna v katalógu" defaultValue />
  </SimpleForm>
);

const ShowActions = () => (
  <TopToolbar>
    <EditButton />
    <DeleteButton mutationMode="pessimistic" />
  </TopToolbar>
);

export const CategoryShow = () => (
  <Show title={<CategoryTitle />} actions={<ShowActions />}>
    <SimpleShowLayout>
      <TextField source="name" label="Názov" />
      <TextField source="description" label="Popis" emptyText="—" />
      <ColorSwatchField />
      <ActiveChipField />
      <Divider sx={{ my: 2 }} />
      <Typography variant="overline" color="text.secondary">
        Tituly v kategórii
      </Typography>
      <ReferenceManyField
        reference="books"
        target="categoryId"
        label={false}
        perPage={25}
        sort={{ field: "title", order: "ASC" }}
      >
        <Datagrid bulkActionButtons={false} rowClick="show">
          <TextField source="title" label="Názov" />
          <TextField source="author" label="Autor" />
          <StockField />
        </Datagrid>
      </ReferenceManyField>
      <MetaDates />
    </SimpleShowLayout>
  </Show>
);

export const CategoryEdit = () => (
  <Edit title={<CategoryTitle />}>
    <CategoryForm />
  </Edit>
);

export const CategoryCreate = () => (
  <Create title="Nová kategória" redirect="show">
    <CategoryForm />
  </Create>
);
