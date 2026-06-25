import { Request, Response } from 'express';

function makeGetItems(service: any) {
    return async (req: Request, res: Response) => {
        const items = await service.getAllItems((req as any).userId);
        res.send(items);
    };
}

module.exports = makeGetItems;
