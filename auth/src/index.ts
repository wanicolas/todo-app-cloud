import { createRepository } from './repository';
import { AuthService } from './service/AuthService';
import createApp from './app';
import { logger } from './utils/logger';

const repository = createRepository();
const service = new AuthService(repository);

let server: any;
const port = process.env.PORT || 3001;

service
    .init()
    .then(() => {
        const app = createApp(service);
        server = app.listen(port, () =>
            logger.info(`Auth service listening on port ${port}`),
        );
    })
    .catch((err: Error) => {
        logger.error('Failed to initialize auth server', err);
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
