import { Request, Response } from 'express';
import { AuthError, AuthService } from '../service/AuthService';

export default function makeDeleteMe(service: AuthService) {
    return async (req: Request, res: Response) => {
        try {
            await service.deleteAccount((req as any).userId);
            res.status(204).send();
        } catch (err) {
            if (err instanceof AuthError) {
                return res.status(err.status).send({ error: err.message });
            }
            res.status(500).send({ error: 'Internal server error' });
        }
    };
}
