import knex, { Knex } from 'knex';
import { User, UserRepository } from '../types';
import { logger } from '../utils/logger';

function mapRow(row: Record<string, unknown> | undefined): User | undefined {
    if (!row) return undefined;
    return {
        id: row.id as string,
        email: row.email as string,
        passwordHash: row.password_hash as string,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
    };
}

class KnexUserRepository implements UserRepository {
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
                    const client = (
                        this.db.client as { config: { client: string } }
                    ).config.client;
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

    async createUser(user: User): Promise<void> {
        // Pass Date objects, not ISO strings: MySQL TIMESTAMP columns reject the
        // "T"/"Z" ISO format, whereas the driver formats a Date correctly.
        await this.db('users').insert({
            id: user.id,
            email: user.email,
            password_hash: user.passwordHash,
            created_at: new Date(user.createdAt),
            updated_at: new Date(user.updatedAt),
        });
    }

    async findByEmail(email: string): Promise<User | undefined> {
        const row = await this.db('users').where({ email }).first();
        return mapRow(row);
    }

    async findById(id: string): Promise<User | undefined> {
        const row = await this.db('users').where({ id }).first();
        return mapRow(row);
    }

    async updateUser(id: string, data: Partial<User>): Promise<void> {
        const patch: Record<string, unknown> = {};
        if (data.email !== undefined) patch.email = data.email;
        if (data.passwordHash !== undefined)
            patch.password_hash = data.passwordHash;
        if (data.updatedAt !== undefined)
            patch.updated_at = new Date(data.updatedAt);
        await this.db('users').where({ id }).update(patch);
    }

    async deleteUser(id: string): Promise<void> {
        await this.db('users').where({ id }).delete();
    }
}

export { KnexUserRepository };
