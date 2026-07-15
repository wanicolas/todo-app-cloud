import { Request, Response } from 'express';

import { TodoService } from '../service/TodoService';

export default function makeDeleteAllItems(service: TodoService) {
    return async (req: Request, res: Response) => {
        await service.removeAllForUser((req as any).userId);
        res.sendStatus(200);
    };
}

