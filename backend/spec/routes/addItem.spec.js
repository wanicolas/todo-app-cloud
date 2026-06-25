const makeAddItem = require('../../src/routes/addItem');

test('it stores item correctly for the authenticated user', async () => {
    const name = 'A sample item';
    const expectedItem = {
        id: 'something-not-a-uuid',
        name,
        completed: false,
        userId: 'user-1',
    };
    const req = { userId: 'user-1', body: { name } };
    const res = { send: jest.fn() };

    const mockService = {
        addItem: jest.fn().mockResolvedValue(expectedItem),
    };

    const handler = makeAddItem(mockService);
    await handler(req, res);

    expect(mockService.addItem).toHaveBeenCalledTimes(1);
    expect(mockService.addItem).toHaveBeenCalledWith('user-1', name);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(expectedItem);
});
