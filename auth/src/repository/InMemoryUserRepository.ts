import { User, UserRepository } from '../types';

class InMemoryUserRepository implements UserRepository {
    private users: Map<string, User> = new Map();

    async init(): Promise<void> {}

    async teardown(): Promise<void> {
        this.users.clear();
    }

    async createUser(user: User): Promise<void> {
        this.users.set(user.id, user);
    }

    async findByEmail(email: string): Promise<User | undefined> {
        return Array.from(this.users.values()).find((u) => u.email === email);
    }

    async findById(id: string): Promise<User | undefined> {
        return this.users.get(id);
    }

    async updateUser(id: string, data: Partial<User>): Promise<void> {
        const existing = this.users.get(id);
        if (existing) this.users.set(id, { ...existing, ...data, id });
    }

    async deleteUser(id: string): Promise<void> {
        this.users.delete(id);
    }
}

module.exports = { InMemoryUserRepository };
