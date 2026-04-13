import { TodoItem, TodoRepository } from '../types';

class InMemoryRepository implements TodoRepository {
    private items: Map<string, TodoItem> = new Map();

    async init(): Promise<void> {}

    async teardown(): Promise<void> {
        this.items.clear();
    }

    async getItems(): Promise<TodoItem[]> {
        return Array.from(this.items.values());
    }

    async getItem(id: string): Promise<TodoItem> {
        return this.items.get(id)!;
    }

    async storeItem(item: TodoItem): Promise<void> {
        this.items.set(item.id, item);
    }

    async updateItem(id: string, item: TodoItem): Promise<void> {
        this.items.set(id, { ...item, id });
    }

    async removeItem(id: string): Promise<void> {
        this.items.delete(id);
    }
}

module.exports = { InMemoryRepository };
