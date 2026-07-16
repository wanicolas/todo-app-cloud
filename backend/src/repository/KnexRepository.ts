import knex, { Knex } from 'knex';
import { TodoItem, TodoRepository } from '../types';
import { logger } from '../utils/logger';

function mapRow(row: unknown): TodoItem | null {
    if (!row || typeof row !== 'object') return null;
    const r = row as { id: string; name: string; completed: number | boolean; user_id: string };
    return {
        id: r.id,
        name: r.name,
        completed: Boolean(r.completed),
        userId: r.user_id,
    };
}

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
                    const client = (this.db.client as unknown as { config: { client: string } }).config.client;
                    logger.info(`Connected to ${client} database via Knex`);
                }
                return;
            } catch (err) {
                if (attempt === maxRetries) throw err;
                if (process.env.NODE_ENV !== 'test') {
                    logger.warn(
                        `Database not ready, retrying (${attempt}/${maxRetries})...`,
                        { error: err instanceof Error ? err.message : err },
                    );
                }
                await new Promise((r) => setTimeout(r, retryDelay));
            }
        }
    }

    async teardown(): Promise<void> {
        await this.db.destroy();
    }

    async getItems(userId: string): Promise<TodoItem[]> {
        const rows = await this.db('todo_items').where({ user_id: userId });
        return rows
            .map(mapRow)
            .filter((item): item is TodoItem => item !== null);
    }

    async getItem(userId: string, id: string): Promise<TodoItem | null> {
        const row = await this.db('todo_items')
            .where({ id, user_id: userId })
            .first();
        return mapRow(row);
    }

    async storeItem(item: TodoItem): Promise<void> {
        await this.db('todo_items').insert({
            id: item.id,
            name: item.name,
            completed: item.completed,
            user_id: item.userId,
        });
    }

    async updateItem(
        userId: string,
        id: string,
        item: TodoItem,
    ): Promise<void> {
        await this.db('todo_items').where({ id, user_id: userId }).update({
            name: item.name,
            completed: item.completed,
        });
    }

    async removeItem(userId: string, id: string): Promise<void> {
        await this.db('todo_items').where({ id, user_id: userId }).delete();
    }

    async removeAllItems(userId: string): Promise<void> {
        await this.db('todo_items').where({ user_id: userId }).delete();
    }
}

export { KnexRepository };
