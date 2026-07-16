import { Request, Response } from 'express';
import { AuthError, AuthService } from '../service/AuthService';

export default function makeExportMe(service: AuthService) {
    return async (req: Request, res: Response) => {
        try {
            const data = await service.exportData((req as Request & { userId: string }).userId);
            res.setHeader(
                'Content-Disposition',
                'attachment; filename="my-data.json"',
            );
            res.send(data);
        } catch (err) {
            if (err instanceof AuthError) {
                return res.status(err.status).send({ error: err.message });
            }
            res.status(500).send({ error: 'Internal server error' });
        }
    };
}
