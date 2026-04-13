const makeGetItems = require('../../src/routes/getItems');

const ITEMS = [{ id: 12345 }];

test('it gets items correctly', async () => {
    const req = {};
    const res = { send: jest.fn() };

    const mockService = {
        getAllItems: jest.fn().mockResolvedValue(ITEMS),
    };

    const handler = makeGetItems(mockService);
    await handler(req, res);

    expect(mockService.getAllItems).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith(ITEMS);
});
