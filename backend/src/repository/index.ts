import { TodoRepository } from '../types';

const { KnexRepository } = require('./KnexRepository');
const { getKnexConfig } = require('./knexConfig');

function createRepository(sqliteLocation?: string): TodoRepository {
    return new KnexRepository(getKnexConfig(sqliteLocation));
}

module.exports = { createRepository };
