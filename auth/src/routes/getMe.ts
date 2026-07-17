import { Request, Response } from 'express';
import { AuthError, AuthService } from '../service/AuthService';

export default function makeGetMe(service: AuthService) {
    return async (req: Request, res: Response) => {
        try {
            const user = await service.getProfile(
                (req as Request & { userId: string }).userId,
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
