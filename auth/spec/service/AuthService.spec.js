const { AuthService, AuthError } = require('../../src/service/AuthService');
const {
    InMemoryUserRepository,
} = require('../../src/repository/InMemoryUserRepository');

process.env.JWT_SECRET = 'test-secret';

let service;

beforeEach(async () => {
    service = new AuthService(new InMemoryUserRepository());
    await service.init();
});

afterEach(async () => {
    await service.teardown();
});

describe('register', () => {
    test('creates a user and returns a token without the hash', async () => {
        const { user, token } = await service.register(
            'Alice@Example.com',
            'password123',
        );
        expect(user.id).toBeDefined();
        expect(user.email).toBe('alice@example.com'); // normalized
        expect(user.passwordHash).toBeUndefined();
        expect(typeof token).toBe('string');
    });

    test('rejects an invalid email', async () => {
        await expect(
            service.register('not-an-email', 'password123'),
        ).rejects.toMatchObject({ status: 400 });
    });

    test('rejects a short password', async () => {
        await expect(
            service.register('bob@example.com', 'short'),
        ).rejects.toMatchObject({ status: 400 });
    });

    test('rejects a duplicate email', async () => {
        await service.register('dup@example.com', 'password123');
        await expect(
            service.register('dup@example.com', 'password123'),
        ).rejects.toMatchObject({ status: 409 });
    });
});

describe('login', () => {
    test('succeeds with correct credentials', async () => {
        await service.register('carol@example.com', 'password123');
        const { token } = await service.login(
            'carol@example.com',
            'password123',
        );
        expect(typeof token).toBe('string');
    });

    test('fails with wrong password (401)', async () => {
        await service.register('dan@example.com', 'password123');
        await expect(
            service.login('dan@example.com', 'wrongpass1'),
        ).rejects.toMatchObject({ status: 401 });
    });

    test('fails for unknown email (401)', async () => {
        await expect(
            service.login('nobody@example.com', 'password123'),
        ).rejects.toMatchObject({ status: 401 });
    });
});

describe('profile management (RGPD)', () => {
    test('updates email and password', async () => {
        const { user } = await service.register(
            'eve@example.com',
            'password123',
        );
        const updated = await service.updateProfile(user.id, {
            email: 'eve2@example.com',
            password: 'newpassword1',
        });
        expect(updated.email).toBe('eve2@example.com');
        const { token } = await service.login(
            'eve2@example.com',
            'newpassword1',
        );
        expect(typeof token).toBe('string');
    });

    test('exports the user data without the hash', async () => {
        const { user } = await service.register(
            'frank@example.com',
            'password123',
        );
        const data = await service.exportData(user.id);
        expect(data.email).toBe('frank@example.com');
        expect(data.passwordHash).toBeUndefined();
    });

    test('deletes the account (right to erasure)', async () => {
        const { user } = await service.register(
            'gina@example.com',
            'password123',
        );
        await service.deleteAccount(user.id);
        await expect(service.getProfile(user.id)).rejects.toMatchObject({
            status: 404,
        });
    });
});

test('AuthError carries an HTTP status', () => {
    const err = new AuthError(418, 'teapot');
    expect(err.status).toBe(418);
    expect(err.message).toBe('teapot');
});
