import { Request, Response } from 'express';

const GREETING = 'Hello world!';

export default async function getGreeting(req: Request, res: Response) {
    res.send({
        greeting: GREETING,
    });
}
