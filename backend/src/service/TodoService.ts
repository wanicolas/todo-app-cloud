import { TodoItem, TodoRepository } from '../types';

const { v4: uuid } = require('uuid');

class TodoService {
    constructor(private repository: TodoRepository) {}

    async init(): Promise<void> {
        return this.repository.init();
    }

    async teardown(): Promise<void> {
        return this.repository.teardown();
    }

    async getAllItems(): Promise<TodoItem[]> {
        return this.repository.getItems();
    }

    async addItem(name: string): Promise<TodoItem> {
        const item: TodoItem = { id: uuid(), name, completed: false };
        await this.repository.storeItem(item);
        return item;
    }

    async updateItem(
        id: string,
        data: { name: string; completed: boolean },
    ): Promise<TodoItem> {
        await this.repository.updateItem(id, { id, ...data });
        return this.repository.getItem(id);
    }

    async removeItem(id: string): Promise<void> {
        return this.repository.removeItem(id);
    }
}

module.exports = { TodoService };
