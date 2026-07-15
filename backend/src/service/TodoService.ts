import { TodoItem, TodoRepository } from '../types';

import { randomUUID } from 'crypto';

class TodoService {
    constructor(private repository: TodoRepository) {}

    async init(): Promise<void> {
        return this.repository.init();
    }

    async teardown(): Promise<void> {
        return this.repository.teardown();
    }

    async getAllItems(userId: string): Promise<TodoItem[]> {
        return this.repository.getItems(userId);
    }

    async addItem(userId: string, name: string): Promise<TodoItem> {
        const item: TodoItem = { id: randomUUID(), name, completed: false, userId };
        await this.repository.storeItem(item);
        return item;
    }

    async updateItem(
        userId: string,
        id: string,
        data: { name: string; completed: boolean },
    ): Promise<TodoItem | null> {
        await this.repository.updateItem(userId, id, { id, userId, ...data });
        return this.repository.getItem(userId, id);
    }

    async removeItem(userId: string, id: string): Promise<void> {
        return this.repository.removeItem(userId, id);
    }

    // Deletes every todo of a user — used when erasing an account (RGPD).
    async removeAllForUser(userId: string): Promise<void> {
        return this.repository.removeAllItems(userId);
    }
}

export { TodoService };
