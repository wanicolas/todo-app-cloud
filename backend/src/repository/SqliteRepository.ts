import { TodoItem, TodoRepository } from '../types';

const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class SqliteRepository implements TodoRepository {
    private db: any;
    private location: string;

    constructor(location?: string) {
        this.location =
            location || process.env.SQLITE_DB_LOCATION || '/etc/todos/todo.db';
    }

    init(): Promise<void> {
        const dirName = path.dirname(this.location);
        if (!fs.existsSync(dirName)) {
            fs.mkdirSync(dirName, { recursive: true });
        }

        return new Promise((acc, rej) => {
            this.db = new sqlite3.Database(
                this.location,
                (err: Error | null) => {
                    if (err) return rej(err);

                    if (process.env.NODE_ENV !== 'test')
                        console.log(
                            `Using sqlite database at ${this.location}`,
                        );

                    this.db.run(
                        'CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean)',
                        (err: Error | null) => {
                            if (err) return rej(err);
                            acc();
                        },
                    );
                },
            );
        });
    }

    async teardown(): Promise<void> {
        return new Promise((acc, rej) => {
            this.db.close((err: Error | null) => {
                if (err) rej(err);
                else acc();
            });
        });
    }

    async getItems(): Promise<TodoItem[]> {
        return new Promise((acc, rej) => {
            this.db.all(
                'SELECT * FROM todo_items',
                (err: Error | null, rows: any[]) => {
                    if (err) return rej(err);
                    acc(
                        rows.map((item) =>
                            Object.assign({}, item, {
                                completed: item.completed === 1,
                            }),
                        ),
                    );
                },
            );
        });
    }

    async getItem(id: string): Promise<TodoItem> {
        return new Promise((acc, rej) => {
            this.db.all(
                'SELECT * FROM todo_items WHERE id=?',
                [id],
                (err: Error | null, rows: any[]) => {
                    if (err) return rej(err);
                    acc(
                        rows.map((item) =>
                            Object.assign({}, item, {
                                completed: item.completed === 1,
                            }),
                        )[0],
                    );
                },
            );
        });
    }

    async storeItem(item: TodoItem): Promise<void> {
        return new Promise((acc, rej) => {
            this.db.run(
                'INSERT INTO todo_items (id, name, completed) VALUES (?, ?, ?)',
                [item.id, item.name, item.completed ? 1 : 0],
                (err: Error | null) => {
                    if (err) return rej(err);
                    acc();
                },
            );
        });
    }

    async updateItem(id: string, item: TodoItem): Promise<void> {
        return new Promise((acc, rej) => {
            this.db.run(
                'UPDATE todo_items SET name=?, completed=? WHERE id = ?',
                [item.name, item.completed ? 1 : 0, id],
                (err: Error | null) => {
                    if (err) return rej(err);
                    acc();
                },
            );
        });
    }

    async removeItem(id: string): Promise<void> {
        return new Promise((acc, rej) => {
            this.db.run(
                'DELETE FROM todo_items WHERE id = ?',
                [id],
                (err: Error | null) => {
                    if (err) return rej(err);
                    acc();
                },
            );
        });
    }
}

module.exports = { SqliteRepository };
