import { UserRepository } from '../types';

const { KnexUserRepository } = require('./KnexUserRepository');
const { getKnexConfig } = require('./knexConfig');

function createRepository(sqliteLocation?: string): UserRepository {
    return new KnexUserRepository(getKnexConfig(sqliteLocation));
}

module.exports = { createRepository };
