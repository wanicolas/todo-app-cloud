import { Request, Response } from 'express';

function makeDeleteItem(service: any) {
    return async (req: Request, res: Response) => {
        await service.removeItem((req as any).userId, req.params.id);
        res.sendStatus(200);
    };
}

module.exports = makeDeleteItem;
