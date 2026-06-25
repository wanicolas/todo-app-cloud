import { Request, Response } from 'express';

const { AuthError } = require('../service/AuthService');

function makeUpdateMe(service: any) {
    return async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const user = await service.updateProfile((req as any).userId, {
                email,
                password,
            });
            res.send(user);
        } catch (err) {
            if (err instanceof AuthError) {
                return res.status(err.status).send({ error: err.message });
            }
            res.status(500).send({ error: 'Internal server error' });
        }
    };
}

module.exports = makeUpdateMe;
