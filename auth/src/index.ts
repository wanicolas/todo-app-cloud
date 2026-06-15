const { createRepository } = require('./repository');
const { AuthService } = require('./service/AuthService');
const createApp = require('./app');

const repository = createRepository();
const service = new AuthService(repository);

service
    .init()
    .then(() => {
        const app = createApp(service);
        app.listen(3001, () =>
            console.log('Auth service listening on port 3001'),
        );
    })
    .catch((err: Error) => {
        console.error(err);
        process.exit(1);
    });

const gracefulShutdown = () => {
    service
        .teardown()
        .catch(() => {})
        .then(() => process.exit());
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);
process.on('SIGUSR2', gracefulShutdown); // Sent by nodemon
