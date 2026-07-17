import { Request, Response } from 'express';
import { AuthError, AuthService } from '../service/AuthService';

export default function makeUpdateMe(service: AuthService) {
    return async (req: Request, res: Response) => {
        try {
            const { email, password } = req.body;
            const user = await service.updateProfile(
                (req as Request & { userId: string }).userId,
                {
                    email,
                    password,
                },
            );
            res.send(user);
        } catch (err) {
            if (err instanceof AuthError) {
                return res.status(err.status).send({ error: err.message });
            }
            res.status(500).send({ error: 'Internal server error' });
        }
    };
}
