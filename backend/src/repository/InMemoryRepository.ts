import { TodoItem, TodoRepository } from '../types';

class InMemoryRepository implements TodoRepository {
    private items: Map<string, TodoItem> = new Map();

    async init(): Promise<void> {}

    async teardown(): Promise<void> {
        this.items.clear();
    }

    async getItems(userId: string): Promise<TodoItem[]> {
        return Array.from(this.items.values()).filter(
            (item) => item.userId === userId,
        );
    }

    async getItem(userId: string, id: string): Promise<TodoItem | null> {
        const item = this.items.get(id);
        return item && item.userId === userId ? item : null;
    }

    async storeItem(item: TodoItem): Promise<void> {
        this.items.set(item.id, item);
    }

    async updateItem(
        userId: string,
        id: string,
        item: TodoItem,
    ): Promise<void> {
        const existing = this.items.get(id);
        if (existing && existing.userId === userId) {
            this.items.set(id, { ...item, id, userId });
        }
    }

    async removeItem(userId: string, id: string): Promise<void> {
        const existing = this.items.get(id);
        if (existing && existing.userId === userId) {
            this.items.delete(id);
        }
    }

    async removeAllItems(userId: string): Promise<void> {
        for (const [id, item] of this.items) {
            if (item.userId === userId) this.items.delete(id);
        }
    }
}

module.exports = { InMemoryRepository };
