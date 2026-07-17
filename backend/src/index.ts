import { createRepository } from './repository';
import { TodoService } from './service/TodoService';
import createApp from './app';
import { logger } from './utils/logger';
import * as http from 'http';

const repository = createRepository();
const service = new TodoService(repository);

let server: http.Server;
const port = process.env.PORT || 3000;

service
    .init()
    .then(() => {
        const app = createApp(service);
        server = app.listen(port, () =>
            logger.info(`Listening on port ${port}`),
        );
    })
    .catch((err: Error) => {
        logger.error('Failed to initialize server', err);
        process.exit(1);
    });

const gracefulShutdown = () => {
    logger.info('Shutdown signal received. Closing HTTP server...');
    const closeServer = () => {
        return new Promise<void>((resolve) => {
            if (server) {
                server.close(() => {
                    logger.info('HTTP server closed.');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    };

    closeServer()
        .then(() => service.teardown())
        .catch((err) => logger.error('Error during teardown', err))
        .then(() => {
            logger.info('Teardown complete. Exiting.');
            process.exit(0);
        });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
