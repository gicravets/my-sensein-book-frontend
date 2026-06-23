// In-memory family users for the mock API (the Go backend is authoritative).
export interface MockUser {
  id: string;
  name: string;
  role: string;
}
export const mockUsers: MockUser[] = [{ id: "u-owner", name: "owner", role: "admin" }];
