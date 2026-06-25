import express from 'express';

const getGreeting = require('./routes/getGreeting');
const makeGetItems = require('./routes/getItems');
const makeAddItem = require('./routes/addItem');
const makeUpdateItem = require('./routes/updateItem');
const makeDeleteItem = require('./routes/deleteItem');
const makeDeleteAllItems = require('./routes/deleteAllItems');
const requireAuth = require('./middleware/requireAuth');

function createApp(service: any) {
    const app = express();

    app.use(express.json());

    // Public endpoint.
    app.get('/api/greeting', getGreeting);

    // Todo endpoints require authentication; each is scoped to req.userId.
    app.get('/api/items', requireAuth, makeGetItems(service));
    app.post('/api/items', requireAuth, makeAddItem(service));
    app.put('/api/items/:id', requireAuth, makeUpdateItem(service));
    app.delete('/api/items', requireAuth, makeDeleteAllItems(service));
    app.delete('/api/items/:id', requireAuth, makeDeleteItem(service));

    return app;
}

module.exports = createApp;
