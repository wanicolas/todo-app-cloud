import { Request, Response } from 'express';

function makeAddItem(service: any) {
    return async (req: Request, res: Response) => {
        const item = await service.addItem((req as any).userId, req.body.name);
        res.send(item);
    };
}

module.exports = makeAddItem;
