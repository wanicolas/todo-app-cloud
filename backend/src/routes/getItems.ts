import { Request, Response } from 'express';

function makeGetItems(service: any) {
    return async (req: Request, res: Response) => {
        const items = await service.getAllItems();
        res.send(items);
    };
}

module.exports = makeGetItems;
