import { Request, Response } from 'express';

import { TodoService } from '../service/TodoService';

export default function makeUpdateItem(service: TodoService) {
    return async (req: Request, res: Response) => {
        const { name, completed } = req.body;
        if (
            typeof name !== 'string' ||
            name.trim() === '' ||
            name.length > 255 ||
            typeof completed !== 'boolean'
        ) {
            return res.status(400).send({ error: 'Invalid item data' });
        }
        const item = await service.updateItem(
            (req as any).userId,
            req.params.id as string,
            {
                name: name.trim(),
                completed,
            },
        );

        if (!item) {
            return res.status(404).send({ error: 'Item not found' });
        }

        res.send(item);
    };
}
