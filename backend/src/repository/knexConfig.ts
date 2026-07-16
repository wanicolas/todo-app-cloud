import type { Knex } from 'knex';

import * as fs from 'fs';
import * as path from 'path';

function readSecret(envVar: string, fileVar: string): string | undefined {
    const filePath = process.env[fileVar];
    if (filePath) return fs.readFileSync(filePath, 'utf8').trim();
    return process.env[envVar];
}

function getKnexConfig(sqliteLocation?: string): Knex.Config {
    const migrationConfig = {
        directory: path.join(__dirname, '../migrations'),
        loadExtensions: ['.ts', '.js'],
    };

    console.log('NODE_ENV is:', process.env.NODE_ENV);
    if (process.env.NODE_ENV !== 'test' && process.env.MYSQL_HOST) {
        const config: Knex.Config = {
            client: 'mysql2',
            connection: {
                host: readSecret('MYSQL_HOST', 'MYSQL_HOST_FILE'),
                user: readSecret('MYSQL_USER', 'MYSQL_USER_FILE'),
                password: readSecret('MYSQL_PASSWORD', 'MYSQL_PASSWORD_FILE'),
                database: readSecret('MYSQL_DB', 'MYSQL_DB_FILE'),
                charset: 'utf8mb4',
                ssl:
                    process.env.MYSQL_SSL === 'true'
                        ? { rejectUnauthorized: false }
                        : undefined,
            },
            pool: { min: 0, max: 5 },
            migrations: migrationConfig,
        };
        console.log('Using MySQL:', (config.connection as { host?: string }).host);
        return config;
    }

    const filename =
        sqliteLocation ||
        process.env.SQLITE_DB_LOCATION ||
        '/etc/todos/todo.db';

    const dirName = path.dirname(filename);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    const config = {
        client: 'sqlite3',
        connection: { filename },
        useNullAsDefault: true,
        migrations: migrationConfig,
    };
    console.log('Using SQLite:', filename);
    return config;
}

export { getKnexConfig };
