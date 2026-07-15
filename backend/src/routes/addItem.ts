import { Request, Response } from 'express';

import { TodoService } from '../service/TodoService';

export default function makeAddItem(service: TodoService) {
    return async (req: Request, res: Response) => {
        const { name } = req.body;
        if (
            typeof name !== 'string' ||
            name.trim() === '' ||
            name.length > 255
        ) {
            return res.status(400).send({ error: 'Invalid name' });
        }

        const item = await service.addItem((req as any).userId, name.trim());
        res.send(item);
    };
}
