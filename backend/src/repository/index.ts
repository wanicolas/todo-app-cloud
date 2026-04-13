import { TodoRepository } from '../types';

function createRepository(): TodoRepository {
    if (process.env.MYSQL_HOST) {
        const { MysqlRepository } = require('./MysqlRepository');
        return new MysqlRepository();
    }
    const { SqliteRepository } = require('./SqliteRepository');
    return new SqliteRepository();
}

module.exports = { createRepository };
