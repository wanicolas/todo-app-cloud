import type { Knex } from 'knex';

import * as fs from 'fs';
import * as path from 'path';

function readSecret(envVar: string, fileVar: string): string | undefined {
    const filePath = process.env[fileVar];
    if (filePath) return fs.readFileSync(filePath, 'utf8').trim();
    return process.env[envVar];
}

function getKnexConfig(): Knex.Config {
    const migrationConfig = {
        directory: path.join(__dirname, '../migrations'),
        loadExtensions: ['.ts', '.js'],
    };

    const config: Knex.Config = {
        client: 'mysql2',
        connection: {
            host: readSecret('MYSQL_HOST', 'MYSQL_HOST_FILE') || '127.0.0.1',
            port: process.env.MYSQL_PORT
                ? parseInt(process.env.MYSQL_PORT, 10)
                : 3306,
            user: readSecret('MYSQL_USER', 'MYSQL_USER_FILE') || 'root',
            password:
                readSecret('MYSQL_PASSWORD', 'MYSQL_PASSWORD_FILE') || 'secret',
            database: readSecret('MYSQL_DB', 'MYSQL_DB_FILE') || 'todos',
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

export { getKnexConfig };
