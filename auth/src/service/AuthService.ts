import { PublicUser, User, UserRepository } from '../types';

const { v4: uuid } = require('uuid');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const BCRYPT_ROUNDS = 10;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

// Thrown for any client-fixable problem; carries the HTTP status to return.
class AuthError extends Error {
    constructor(
        public status: number,
        message: string,
    ) {
        super(message);
        this.name = 'AuthError';
    }
}

function toPublic(user: User): PublicUser {
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { passwordHash, ...rest } = user;
    return rest;
}

class AuthService {
    constructor(private repository: UserRepository) {}

    private get secret(): string {
        return process.env.JWT_SECRET || 'dev-insecure-secret';
    }

    private get expiresIn(): string {
        return process.env.JWT_EXPIRES_IN || '1h';
    }

    async init(): Promise<void> {
        return this.repository.init();
    }

    async teardown(): Promise<void> {
        return this.repository.teardown();
    }

    private validateCredentials(email: string, password: string): void {
        if (!email || !EMAIL_REGEX.test(email)) {
            throw new AuthError(400, 'A valid email is required');
        }
        if (!password || password.length < MIN_PASSWORD_LENGTH) {
            throw new AuthError(
                400,
                `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
            );
        }
    }

    private sign(user: User): string {
        return jwt.sign({ sub: user.id, email: user.email }, this.secret, {
            expiresIn: this.expiresIn,
        });
    }

    async register(
        email: string,
        password: string,
    ): Promise<{ user: PublicUser; token: string }> {
        this.validateCredentials(email, password);

        const normalizedEmail = email.toLowerCase().trim();
        const existing = await this.repository.findByEmail(normalizedEmail);
        if (existing) {
            throw new AuthError(409, 'Email already registered');
        }

        const now = new Date().toISOString();
        const user: User = {
            id: uuid(),
            email: normalizedEmail,
            passwordHash: await bcrypt.hash(password, BCRYPT_ROUNDS),
            createdAt: now,
            updatedAt: now,
        };
        await this.repository.createUser(user);

        return { user: toPublic(user), token: this.sign(user) };
    }

    async login(
        email: string,
        password: string,
    ): Promise<{ user: PublicUser; token: string }> {
        const normalizedEmail = (email || '').toLowerCase().trim();
        const user = await this.repository.findByEmail(normalizedEmail);
        // Same error whether the email is unknown or the password is wrong.
        const ok =
            user && (await bcrypt.compare(password || '', user.passwordHash));
        if (!user || !ok) {
            throw new AuthError(401, 'Invalid email or password');
        }

        return { user: toPublic(user), token: this.sign(user) };
    }

    async getProfile(id: string): Promise<PublicUser> {
        const user = await this.repository.findById(id);
        if (!user) throw new AuthError(404, 'User not found');
        return toPublic(user);
    }

    async updateProfile(
        id: string,
        data: { email?: string; password?: string },
    ): Promise<PublicUser> {
        const user = await this.repository.findById(id);
        if (!user) throw new AuthError(404, 'User not found');

        const patch: Partial<User> = { updatedAt: new Date().toISOString() };

        if (data.email !== undefined) {
            const normalizedEmail = data.email.toLowerCase().trim();
            if (!EMAIL_REGEX.test(normalizedEmail)) {
                throw new AuthError(400, 'A valid email is required');
            }
            const clash = await this.repository.findByEmail(normalizedEmail);
            if (clash && clash.id !== id) {
                throw new AuthError(409, 'Email already registered');
            }
            patch.email = normalizedEmail;
        }

        if (data.password !== undefined) {
            if (data.password.length < MIN_PASSWORD_LENGTH) {
                throw new AuthError(
                    400,
                    `Password must be at least ${MIN_PASSWORD_LENGTH} characters`,
                );
            }
            patch.passwordHash = await bcrypt.hash(
                data.password,
                BCRYPT_ROUNDS,
            );
        }

        await this.repository.updateUser(id, patch);
        return toPublic({ ...user, ...patch });
    }

    async deleteAccount(id: string): Promise<void> {
        const user = await this.repository.findById(id);
        if (!user) throw new AuthError(404, 'User not found');
        await this.repository.deleteUser(id);
    }

    // RGPD data portability: everything we hold about the user, minus the hash.
    async exportData(id: string): Promise<PublicUser> {
        return this.getProfile(id);
    }
}

module.exports = { AuthService, AuthError };
