import { Request, Response } from 'express';

const GREETING = 'Hello world!';

module.exports = async (req: Request, res: Response) => {
    res.send({
        greeting: GREETING,
    });
};
