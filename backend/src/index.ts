const { createRepository } = require('./repository');
const { TodoService } = require('./service/TodoService');
const createApp = require('./app');

const repository = createRepository();
const service = new TodoService(repository);

service
    .init()
    .then(() => {
        const app = createApp(service);
        app.listen(3000, () => console.log('Listening on port 3000'));
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
