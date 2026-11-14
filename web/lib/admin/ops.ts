import { adminHttp } from "@/lib/admin/http";

export type ServiceHealth = {
  name: string;
  url: string;
  healthy: boolean;
  status: string;
  latencyMs?: number | null;
};

export type AdminDashboard = {
  generatedAt: string;
  actor: string;
  roles: string[];
  services: ServiceHealth[];
  healthyCount: number;
  unhealthyCount: number;
};

export type CatalogStats = {
  books: number;
  authors: number;
  categories: number;
  availableBooks: number;
  partial: boolean;
};

export type BookingStats = {
  total: number;
  reserved: number;
  active: number;
  overdue: number;
  returned: number;
  cancelled: number;
  partial: boolean;
};

export type BookingAttention = {
  id: string;
  bookId: string;
  borrowerName: string;
  borrowerEmail: string;
  status: number;
  dueDate: string;
};

export type AdminOverview = {
  generatedAt: string;
  actor: string;
  roles: string[];
  catalog: CatalogStats;
  bookings: BookingStats;
  services: ServiceHealth[];
  healthyCount: number;
  unhealthyCount: number;
  attention: BookingAttention[];
};

export type ServiceRegistry = {
  generatedAt: string;
  services: Array<{
    name: string;
    configKey: string;
    baseUrl: string;
    healthUrl: string;
  }>;
};

export type AdminProbe = {
  generatedAt: string;
  services: ServiceHealth[];
  healthyCount: number;
  unhealthyCount: number;
};

export function fetchAdminOverview() {
  return adminHttp<AdminOverview>("/api/admin/overview");
}

export function fetchAdminProbe() {
  return adminHttp<AdminProbe>("/api/admin/probe");
}

export function fetchAdminServices() {
  return adminHttp<ServiceRegistry>("/api/admin/services");
}

export function fetchAdminAttention() {
  return adminHttp<BookingAttention[]>("/api/admin/attention");
}
