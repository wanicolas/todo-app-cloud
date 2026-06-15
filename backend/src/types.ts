export interface TodoItem {
    id: string;
    name: string;
    completed: boolean;
    userId: string;
}

export interface TodoRepository {
    init(): Promise<void>;
    teardown(): Promise<void>;
    getItems(userId: string): Promise<TodoItem[]>;
    getItem(userId: string, id: string): Promise<TodoItem>;
    storeItem(item: TodoItem): Promise<void>;
    updateItem(userId: string, id: string, item: TodoItem): Promise<void>;
    removeItem(userId: string, id: string): Promise<void>;
    removeAllItems(userId: string): Promise<void>;
}

export type Persistence = TodoRepository;
