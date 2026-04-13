import express from 'express';
import path from 'path';

const getGreeting = require('./routes/getGreeting');
const makeGetItems = require('./routes/getItems');
const makeAddItem = require('./routes/addItem');
const makeUpdateItem = require('./routes/updateItem');
const makeDeleteItem = require('./routes/deleteItem');

function createApp(service: any) {
    const app = express();

    app.use(express.json());
    app.use(express.static(path.join(__dirname, 'static')));

    app.get('/api/greeting', getGreeting);
    app.get('/api/items', makeGetItems(service));
    app.post('/api/items', makeAddItem(service));
    app.put('/api/items/:id', makeUpdateItem(service));
    app.delete('/api/items/:id', makeDeleteItem(service));

    return app;
}

module.exports = createApp;
