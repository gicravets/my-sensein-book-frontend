// In-memory smart-shelf store for the mock API (the Go backend persists for real).
export interface SmartRules {
  filter?: string;
  search?: string;
  tag?: string;
  author?: string;
  sort?: string;
}
export interface MockSmartShelf {
  id: string;
  name: string;
  rules: SmartRules;
}

export const smartShelves: MockSmartShelf[] = [];
