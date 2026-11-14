import {
  BooleanField,
  BooleanInput,
  Create,
  Datagrid,
  Edit,
  List,
  SimpleForm,
  TextField,
  TextInput,
} from "react-admin";

export const CategoryList = () => (
  <List sort={{ field: "name", order: "ASC" }} perPage={25}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="name" />
      <TextField source="description" />
      <TextField source="color" />
      <BooleanField source="isActive" />
    </Datagrid>
  </List>
);

const CategoryForm = () => (
  <SimpleForm>
    <TextInput source="name" required fullWidth />
    <TextInput source="description" multiline fullWidth rows={3} />
    <TextInput source="color" helperText="CSS farba, napr. #3f6f54" />
    <BooleanInput source="isActive" defaultValue />
  </SimpleForm>
);

export const CategoryEdit = () => (
  <Edit>
    <CategoryForm />
  </Edit>
);

export const CategoryCreate = () => (
  <Create>
    <CategoryForm />
  </Create>
);
