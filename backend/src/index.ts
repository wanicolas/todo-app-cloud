const { createRepository } = require('./repository');
const { TodoService } = require('./service/TodoService');
const createApp = require('./app');

const repository = createRepository();
const service = new TodoService(repository);

let server: any;
const port = process.env.PORT || 3000;

service
    .init()
    .then(() => {
        const app = createApp(service);
        server = app.listen(port, () => console.log(`Listening on port ${port}`));
    })
    .catch((err: Error) => {
        console.error(err);
        process.exit(1);
    });

const gracefulShutdown = () => {
    console.log('Shutdown signal received. Closing HTTP server...');
    const closeServer = () => {
        return new Promise<void>((resolve) => {
            if (server) {
                server.close(() => {
                    console.log('HTTP server closed.');
                    resolve();
                });
            } else {
                resolve();
            }
        });
    };

    closeServer()
        .then(() => service.teardown())
        .catch((err) => console.error('Error during teardown:', err))
        .then(() => {
            console.log('Teardown complete. Exiting.');
            process.exit(0);
        });
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
