export interface TodoItem {
    id: string;
    name: string;
    completed: boolean;
}

export interface TodoRepository {
    init(): Promise<void>;
    teardown(): Promise<void>;
    getItems(): Promise<TodoItem[]>;
    getItem(id: string): Promise<TodoItem>;
    storeItem(item: TodoItem): Promise<void>;
    updateItem(id: string, item: TodoItem): Promise<void>;
    removeItem(id: string): Promise<void>;
}

export type Persistence = TodoRepository;
