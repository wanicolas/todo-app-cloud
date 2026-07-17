import { Request, Response } from 'express';

export default function makeLogout() {
    return (_req: Request, res: Response) => {
        res.clearCookie('auth_token', {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            path: '/',
        });
        res.status(204).send();
    };
}
