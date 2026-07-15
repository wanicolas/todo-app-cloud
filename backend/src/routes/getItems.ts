import { Request, Response } from 'express';

import { TodoService } from '../service/TodoService';

export default function makeGetItems(service: TodoService) {
    return async (req: Request, res: Response) => {
        const items = await service.getAllItems((req as any).userId);
        res.send(items);
    };
}
