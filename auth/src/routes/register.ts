import { Request, Response } from 'express';
import { AuthError, AuthService } from '../service/AuthService';

export default function makeRegister(service: AuthService) {
    return async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const { user, token } = await service.register(email, password);
            res.cookie('auth_token', token, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                path: '/',
            });
            res.status(201).send({ user });
        } catch (err) {
            if (err instanceof AuthError) {
                return res.status(err.status).send({ error: err.message });
            }
            res.status(500).send({ error: 'Internal server error' });
        }
    };
}
