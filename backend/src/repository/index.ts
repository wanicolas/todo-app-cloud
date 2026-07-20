import { TodoRepository } from '../types';

import { KnexRepository } from './KnexRepository';
import { getKnexConfig } from './knexConfig';

function createRepository(): TodoRepository {
    return new KnexRepository(getKnexConfig());
}

export { createRepository };
