import { TodoRepository } from '../types';

import { KnexRepository } from './KnexRepository';
import { getKnexConfig } from './knexConfig';

function createRepository(sqliteLocation?: string): TodoRepository {
    return new KnexRepository(getKnexConfig(sqliteLocation));
}

export { createRepository };
