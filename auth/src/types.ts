export interface User {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: string;
    updatedAt: string;
}

// User representation safe to return over the API (never exposes the hash).
export type PublicUser = Omit<User, 'passwordHash'>;

export interface UserRepository {
    init(): Promise<void>;
    teardown(): Promise<void>;
    createUser(user: User): Promise<void>;
    findByEmail(email: string): Promise<User | undefined>;
    findById(id: string): Promise<User | undefined>;
    updateUser(id: string, data: Partial<User>): Promise<void>;
    deleteUser(id: string): Promise<void>;
}
