import { UserRepository } from '../types';
import { KnexUserRepository } from './KnexUserRepository';
import { getKnexConfig } from './knexConfig';

export function createRepository(sqliteLocation?: string): UserRepository {
    return new KnexUserRepository(getKnexConfig(sqliteLocation));
}
