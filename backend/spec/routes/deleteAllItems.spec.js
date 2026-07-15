const makeDeleteAllItems = require('../../src/routes/deleteAllItems').default || require('../../src/routes/deleteAllItems');

test('it removes all items for the authenticated user', async () => {
    const req = { userId: 'user-1' };
    const res = { sendStatus: jest.fn() };

    const mockService = {
        removeAllForUser: jest.fn().mockResolvedValue(undefined),
    };

    const handler = makeDeleteAllItems(mockService);
    await handler(req, res);

    expect(mockService.removeAllForUser).toHaveBeenCalledTimes(1);
    expect(mockService.removeAllForUser).toHaveBeenCalledWith('user-1');
    expect(res.sendStatus).toHaveBeenCalledWith(200);
});
