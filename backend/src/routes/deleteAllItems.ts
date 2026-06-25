import { Request, Response } from 'express';

function makeDeleteAllItems(service: any) {
    return async (req: Request, res: Response) => {
        await service.removeAllForUser((req as any).userId);
        res.sendStatus(200);
    };
}

module.exports = makeDeleteAllItems;
