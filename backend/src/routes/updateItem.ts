import { Request, Response } from 'express';

function makeUpdateItem(service: any) {
    return async (req: Request, res: Response) => {
        const item = await service.updateItem(req.params.id, {
            name: req.body.name,
            completed: req.body.completed,
        });
        res.send(item);
    };
}

module.exports = makeUpdateItem;
