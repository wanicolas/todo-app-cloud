import { Request, Response } from 'express';

const db = require('../persistence');
const { v4: uuid } = require('uuid');

module.exports = async (req: Request, res: Response) => {
    const item = {
        id: uuid(),
        name: req.body.name,
        completed: false,
    };

    await db.storeItem(item);
    res.send(item);
};
