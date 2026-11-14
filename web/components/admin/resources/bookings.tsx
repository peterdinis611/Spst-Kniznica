import {
  Create,
  Datagrid,
  DateField,
  DateTimeInput,
  Edit,
  EmailField,
  List,
  ReferenceField,
  ReferenceInput,
  SelectField,
  SelectInput,
  SimpleForm,
  TextField,
  TextInput,
  required,
} from "react-admin";

const STATUS_CHOICES = [
  { id: 0, name: "Rezervované" },
  { id: 1, name: "Požičané" },
  { id: 2, name: "Vrátené" },
  { id: 3, name: "Zrušené" },
  { id: 4, name: "Po termíne" },
];

export const BookingList = () => (
  <List sort={{ field: "dueDate", order: "ASC" }} perPage={25}>
    <Datagrid rowClick="edit" bulkActionButtons={false}>
      <ReferenceField source="bookId" reference="books" link="edit">
        <TextField source="title" />
      </ReferenceField>
      <TextField source="borrowerName" />
      <EmailField source="borrowerEmail" />
      <SelectField source="status" choices={STATUS_CHOICES} />
      <DateField source="dueDate" showTime />
    </Datagrid>
  </List>
);

const BookingForm = () => (
  <SimpleForm>
    <ReferenceInput source="bookId" reference="books" perPage={50}>
      <SelectInput optionText="title" validate={required()} fullWidth />
    </ReferenceInput>
    <TextInput source="borrowerName" validate={required()} fullWidth />
    <TextInput source="borrowerEmail" validate={required()} fullWidth />
    <SelectInput
      source="status"
      choices={STATUS_CHOICES}
      defaultValue={0}
      validate={required()}
    />
    <DateTimeInput source="dueDate" validate={required()} />
    <TextInput source="notes" multiline fullWidth rows={3} />
  </SimpleForm>
);

export const BookingEdit = () => (
  <Edit>
    <BookingForm />
  </Edit>
);

export const BookingCreate = () => (
  <Create>
    <BookingForm />
  </Create>
);
