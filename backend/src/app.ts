import express from 'express';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import getGreeting from './routes/getGreeting';
import makeGetItems from './routes/getItems';
import makeAddItem from './routes/addItem';
import makeUpdateItem from './routes/updateItem';
import makeDeleteItem from './routes/deleteItem';
import makeDeleteAllItems from './routes/deleteAllItems';
import requireAuth from './middleware/requireAuth';
import { TodoService } from './service/TodoService';

export default function createApp(service: TodoService) {
    const app = express();

    app.use(helmet());
    app.use(cookieParser());
    app.use(express.json());

    // Public endpoint.
    app.get('/api/greeting', getGreeting);

    // Todo endpoints require authentication; each is scoped to req.userId.
    app.get('/api/items', requireAuth, makeGetItems(service));
    app.post('/api/items', requireAuth, makeAddItem(service));
    app.put('/api/items/:id', requireAuth, makeUpdateItem(service));
    app.delete('/api/items', requireAuth, makeDeleteAllItems(service));
    app.delete('/api/items/:id', requireAuth, makeDeleteItem(service));

    // Global error handler
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    app.use((err: unknown, req: express.Request, res: express.Response, _next: express.NextFunction) => {
        console.error('Unhandled error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
    });

    return app;
}
