const getGreeting = require('../../src/routes/getGreeting');

test('it returns greeting correctly', async () => {
    const req = {};
    const res = { send: jest.fn() };

    await getGreeting(req, res);

    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith({ greeting: 'Hello world!' });
});
