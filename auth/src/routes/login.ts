import { Request, Response } from 'express';

const { AuthError } = require('../service/AuthService');

function makeLogin(service: any) {
    return async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const result = await service.login(email, password);
            res.send(result);
        } catch (err) {
            if (err instanceof AuthError) {
                return res.status(err.status).send({ error: err.message });
            }
            res.status(500).send({ error: 'Internal server error' });
        }
    };
}

module.exports = makeLogin;
