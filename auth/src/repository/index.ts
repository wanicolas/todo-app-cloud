import { UserRepository } from '../types';
import { KnexUserRepository } from './KnexUserRepository';
import { getKnexConfig } from './knexConfig';

export function createRepository(): UserRepository {
    return new KnexUserRepository(getKnexConfig());
}
