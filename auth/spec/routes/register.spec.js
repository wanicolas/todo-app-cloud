const { default: makeRegister } = require('../../src/routes/register');
const { AuthError } = require('../../src/service/AuthService');

test('returns 201 with the created user and sets cookie', async () => {
    const expected = { user: { id: 'x', email: 'a@b.com' }, token: 'jwt' };
    const req = { body: { email: 'a@b.com', password: 'password123' } };
    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
        cookie: jest.fn(),
    };
    const service = { register: jest.fn().mockResolvedValue(expected) };

    await makeRegister(service)(req, res);

    expect(service.register).toHaveBeenCalledWith('a@b.com', 'password123');
    expect(res.cookie).toHaveBeenCalledWith(
        'auth_token',
        'jwt',
        expect.any(Object),
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.send).toHaveBeenCalledWith({ user: expected.user });
});

test('maps an AuthError to its HTTP status', async () => {
    const req = { body: {} };
    const res = {
        status: jest.fn().mockReturnThis(),
        send: jest.fn(),
    };
    const service = {
        register: jest.fn().mockRejectedValue(new AuthError(409, 'taken')),
    };

    await makeRegister(service)(req, res);

    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.send).toHaveBeenCalledWith({ error: 'taken' });
});
