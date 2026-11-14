"use client";

import {
  DateField,
  FunctionField,
  TextField,
  type RaRecord,
} from "react-admin";
import Chip from "@mui/material/Chip";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export const FORMAT_CHOICES = [
  { id: 0, name: "Paperback" },
  { id: 1, name: "Hardcover" },
  { id: 2, name: "Ebook" },
  { id: 3, name: "Other" },
];

export const COPY_STATUS_CHOICES = [
  { id: 0, name: "Dostupný" },
  { id: 1, name: "Požičaný" },
  { id: 2, name: "Rezervovaný" },
  { id: 3, name: "Stratený" },
  { id: 4, name: "Údržba" },
];

export const BOOKING_STATUS_CHOICES = [
  { id: 0, name: "Rezervované" },
  { id: 1, name: "Požičané" },
  { id: 2, name: "Vrátené" },
  { id: 3, name: "Zrušené" },
  { id: 4, name: "Po termíne" },
];

export const ACTIVE_CHOICES = [
  { id: true, name: "Aktívne" },
  { id: false, name: "Neaktívne" },
];

const STATUS_COLOR: Record<
  number,
  "default" | "success" | "warning" | "error" | "info"
> = {
  0: "info",
  1: "success",
  2: "default",
  3: "default",
  4: "error",
};

export function BookingStatusField({ source = "status" }: { source?: string }) {
  return (
    <FunctionField
      source={source}
      label="Stav"
      render={(record: RaRecord) => {
        const value = Number(record?.[source]);
        const label =
          BOOKING_STATUS_CHOICES.find((c) => c.id === value)?.name ??
          String(value);
        return (
          <Chip
            size="small"
            label={label}
            color={STATUS_COLOR[value] ?? "default"}
            variant="outlined"
            sx={{ borderRadius: 0, fontWeight: 600 }}
          />
        );
      }}
    />
  );
}

export function StockField() {
  return (
    <FunctionField
      label="Fond"
      sortBy="availableCopies"
      render={(record: RaRecord) => {
        const available = Number(record?.availableCopies ?? 0);
        const total = Number(record?.totalCopies ?? 0);
        const ratio = total > 0 ? available / total : 0;
        const tone =
          available === 0 ? "error" : ratio <= 0.35 ? "warning" : "success";
        return (
          <Chip
            size="small"
            color={tone}
            variant="outlined"
            label={`${available} / ${total}`}
            sx={{
              borderRadius: 0,
              fontFamily: "var(--font-mono-family)",
              fontWeight: 600,
            }}
          />
        );
      }}
    />
  );
}

export function ColorSwatchField({ source = "color" }: { source?: string }) {
  return (
    <FunctionField
      source={source}
      label="Farba"
      render={(record: RaRecord) => {
        const color = String(record?.[source] ?? "");
        if (!color) return <Typography variant="caption">—</Typography>;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Box
              sx={{
                width: 14,
                height: 14,
                bgcolor: color,
                border: "1px solid",
                borderColor: "divider",
                flexShrink: 0,
              }}
            />
            <Typography
              variant="caption"
              sx={{ fontFamily: "var(--font-mono-family)" }}
            >
              {color}
            </Typography>
          </Box>
        );
      }}
    />
  );
}

export function ActiveChipField() {
  return (
    <FunctionField
      source="isActive"
      label="Stav"
      render={(record: RaRecord) => (
        <Chip
          size="small"
          label={record?.isActive ? "Aktívny" : "Neaktívny"}
          color={record?.isActive ? "success" : "default"}
          variant="outlined"
          sx={{ borderRadius: 0 }}
        />
      )}
    />
  );
}

export function MetaDates() {
  return (
    <Box
      sx={{
        mt: 2,
        display: "flex",
        flexWrap: "wrap",
        gap: 3,
      }}
    >
      <Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          Vytvorené
        </Typography>
        <DateField source="createdAt" showTime emptyText="—" />
      </Box>
      <Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          Upravené
        </Typography>
        <DateField source="updatedAt" showTime emptyText="—" />
      </Box>
      <Box>
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ display: "block" }}
        >
          ID
        </Typography>
        <TextField
          source="id"
          sx={{ fontFamily: "var(--font-mono-family)", fontSize: 12 }}
        />
      </Box>
    </Box>
  );
}

export function SectionTitle({ children }: { children: string }) {
  return (
    <Typography
      variant="overline"
      sx={{
        display: "block",
        width: "100%",
        mt: 2,
        mb: 1,
        color: "secondary.main",
        letterSpacing: "0.16em",
      }}
    >
      {children}
    </Typography>
  );
}
