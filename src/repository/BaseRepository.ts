export interface Repository<T> {
  findById(id: number): T | null;
  findAll(): T[];
  create(payload: Omit<T, "id" | "createdAt">): T;
  delete(id: number): boolean;
}
