import knex, { Knex } from 'knex';
import { TodoItem, TodoRepository } from '../types';

class KnexRepository implements TodoRepository {
    private db: Knex;

    constructor(config: Knex.Config) {
        this.db = knex(config);
    }

    async init(): Promise<void> {
        const maxRetries = 10;
        const retryDelay = 3000;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                await this.db.migrate.latest();
                if (process.env.NODE_ENV !== 'test') {
                    const client = (this.db.client as any).config.client;
                    console.log(`Connected to ${client} database via Knex`);
                }
                return;
            } catch (err) {
                if (attempt === maxRetries) throw err;
                if (process.env.NODE_ENV !== 'test') {
                    console.log(
                        `Database not ready, retrying (${attempt}/${maxRetries})...`,
                    );
                }
                await new Promise((r) => setTimeout(r, retryDelay));
            }
        }
    }

    async teardown(): Promise<void> {
        await this.db.destroy();
    }

    async getItems(): Promise<TodoItem[]> {
        const rows = await this.db('todo_items').select('*');
        return rows.map((row) => ({
            id: row.id,
            name: row.name,
            completed: Boolean(row.completed),
        }));
    }

    async getItem(id: string): Promise<TodoItem> {
        const row = await this.db('todo_items').where({ id }).first();
        return {
            id: row.id,
            name: row.name,
            completed: Boolean(row.completed),
        };
    }

    async storeItem(item: TodoItem): Promise<void> {
        await this.db('todo_items').insert({
            id: item.id,
            name: item.name,
            completed: item.completed,
        });
    }

    async updateItem(id: string, item: TodoItem): Promise<void> {
        await this.db('todo_items').where({ id }).update({
            name: item.name,
            completed: item.completed,
        });
    }

    async removeItem(id: string): Promise<void> {
        await this.db('todo_items').where({ id }).delete();
    }
}

module.exports = { KnexRepository };
