const makeAddItem = require('../../src/routes/addItem');

test('it stores item correctly', async () => {
    const name = 'A sample item';
    const expectedItem = {
        id: 'something-not-a-uuid',
        name,
        completed: false,
    };
    const req = { body: { name } };
    const res = { send: jest.fn() };

    const mockService = {
        addItem: jest.fn().mockResolvedValue(expectedItem),
    };

    const handler = makeAddItem(mockService);
    await handler(req, res);

    expect(mockService.addItem).toHaveBeenCalledTimes(1);
    expect(mockService.addItem).toHaveBeenCalledWith(name);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(expectedItem);
});
