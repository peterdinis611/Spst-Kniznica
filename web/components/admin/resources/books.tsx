import {
  Create,
  Datagrid,
  Edit,
  List,
  NumberField,
  NumberInput,
  ReferenceInput,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from "react-admin";

const FORMAT_CHOICES = [
  { id: 0, name: "Paperback" },
  { id: 1, name: "Hardcover" },
  { id: 2, name: "Ebook" },
  { id: 3, name: "Other" },
];

export const BookList = () => (
  <List sort={{ field: "title", order: "ASC" }} perPage={25}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="title" />
      <TextField source="author" />
      <TextField source="categoryName" label="Kategória" />
      <NumberField source="availableCopies" label="Dostupných" />
      <NumberField source="totalCopies" label="Kusov" />
      <TextField source="shelfLocation" label="Polica" />
    </Datagrid>
  </List>
);

const BookForm = () => (
  <SimpleForm>
    <TextInput source="title" validate={required()} fullWidth />
    <TextInput source="subtitle" fullWidth />
    <ReferenceInput source="authorId" reference="authors" perPage={50}>
      <SelectInput optionText="name" validate={required()} fullWidth />
    </ReferenceInput>
    <ReferenceInput source="categoryId" reference="categories" perPage={50} allowEmpty>
      <SelectInput optionText="name" fullWidth />
    </ReferenceInput>
    <TextInput source="publisher" />
    <TextInput source="isbn" />
    <NumberInput source="publishedYear" />
    <TextInput source="language" />
    <SelectInput source="format" choices={FORMAT_CHOICES} defaultValue={0} />
    <TextInput source="shelfLocation" />
    <NumberInput source="totalCopies" defaultValue={1} min={1} />
    <NumberInput source="availableCopies" defaultValue={1} min={0} />
    <NumberInput source="pageCount" />
    <TextInput source="description" multiline fullWidth rows={4} />
  </SimpleForm>
);

export const BookEdit = () => (
  <Edit>
    <BookForm />
  </Edit>
);

export const BookCreate = () => (
  <Create>
    <BookForm />
  </Create>
);
