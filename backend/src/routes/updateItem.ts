import { Request, Response } from 'express';

function makeUpdateItem(service: any) {
    return async (req: Request, res: Response) => {
        const { name, completed } = req.body;
        if (
            typeof name !== 'string' ||
            name.trim() === '' ||
            name.length > 255
        ) {
            return res.status(400).send({ error: 'Invalid name' });
        }

        const item = await service.updateItem(
            (req as any).userId,
            req.params.id,
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

module.exports = makeUpdateItem;
