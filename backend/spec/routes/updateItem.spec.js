const makeUpdateItem = require('../../src/routes/updateItem');

const ITEM = { id: 1234, name: 'New title', completed: false };

test('it updates items correctly', async () => {
    const req = {
        params: { id: 1234 },
        body: { name: 'New title', completed: false },
    };
    const res = { send: jest.fn() };

    const mockService = {
        updateItem: jest.fn().mockResolvedValue(ITEM),
    };

    const handler = makeUpdateItem(mockService);
    await handler(req, res);

    expect(mockService.updateItem).toHaveBeenCalledTimes(1);
    expect(mockService.updateItem).toHaveBeenCalledWith(1234, {
        name: 'New title',
        completed: false,
    });
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(ITEM);
});
