const makeDeleteItem = require('../../src/routes/deleteItem').default || require('../../src/routes/deleteItem');

test('it removes item for the authenticated user', async () => {
    const req = { userId: 'user-1', params: { id: 12345 } };
    const res = { sendStatus: jest.fn() };

    const mockService = {
        removeItem: jest.fn().mockResolvedValue(undefined),
    };

    const handler = makeDeleteItem(mockService);
    await handler(req, res);

    expect(mockService.removeItem).toHaveBeenCalledTimes(1);
    expect(mockService.removeItem).toHaveBeenCalledWith('user-1', 12345);
    expect(res.sendStatus).toHaveBeenCalledTimes(1);
    expect(res.sendStatus).toHaveBeenCalledWith(200);
});
