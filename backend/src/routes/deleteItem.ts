import { Request, Response } from 'express';

import { TodoService } from '../service/TodoService';

export default function makeDeleteItem(service: TodoService) {
    return async (req: Request, res: Response) => {
        await service.removeItem((req as any).userId, req.params.id as string);
        res.sendStatus(200);
    };
}

