import type { Knex } from 'knex';

const fs = require('fs');
const path = require('path');

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

    if (process.env.MYSQL_HOST) {
        return {
            client: 'mysql2',
            connection: {
                host: readSecret('MYSQL_HOST', 'MYSQL_HOST_FILE'),
                user: readSecret('MYSQL_USER', 'MYSQL_USER_FILE'),
                password: readSecret('MYSQL_PASSWORD', 'MYSQL_PASSWORD_FILE'),
                database: readSecret('MYSQL_DB', 'MYSQL_DB_FILE'),
                charset: 'utf8mb4',
            },
            pool: { min: 0, max: 5 },
            migrations: migrationConfig,
        };
    }

    const filename =
        sqliteLocation || process.env.SQLITE_DB_LOCATION || '/etc/auth/auth.db';

    const dirName = path.dirname(filename);
    if (!fs.existsSync(dirName)) {
        fs.mkdirSync(dirName, { recursive: true });
    }

    return {
        client: 'sqlite3',
        connection: { filename },
        useNullAsDefault: true,
        migrations: migrationConfig,
    };
}

module.exports = { getKnexConfig };
