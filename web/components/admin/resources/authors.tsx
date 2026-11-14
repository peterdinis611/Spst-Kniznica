import {
  BooleanField,
  BooleanInput,
  Create,
  Datagrid,
  Edit,
  List,
  NumberField,
  NumberInput,
  SimpleForm,
  TextField,
  TextInput,
} from "react-admin";

export const AuthorList = () => (
  <List sort={{ field: "name", order: "ASC" }} perPage={25}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <TextField source="name" />
      <TextField source="nationality" />
      <NumberField source="birthYear" />
      <BooleanField source="isActive" />
    </Datagrid>
  </List>
);

const AuthorForm = () => (
  <SimpleForm>
    <TextInput source="name" required fullWidth />
    <TextInput source="biography" multiline fullWidth rows={4} />
    <TextInput source="nationality" />
    <NumberInput source="birthYear" />
    <BooleanInput source="isActive" defaultValue />
  </SimpleForm>
);

export const AuthorEdit = () => (
  <Edit>
    <AuthorForm />
  </Edit>
);

export const AuthorCreate = () => (
  <Create>
    <AuthorForm />
  </Create>
);
