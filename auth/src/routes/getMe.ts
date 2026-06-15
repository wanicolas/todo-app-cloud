import { Request, Response } from 'express';

const { AuthError } = require('../service/AuthService');

function makeGetMe(service: any) {
    return async (req: Request, res: Response) => {
        try {
            const user = await service.getProfile((req as any).userId);
            res.send(user);
        } catch (err) {
            if (err instanceof AuthError) {
                return res.status(err.status).send({ error: err.message });
            }
            res.status(500).send({ error: 'Internal server error' });
        }
    };
}

module.exports = makeGetMe;
