import { TodoItem, TodoRepository } from '../types';

const waitPort = require('wait-port');
const fs = require('fs');
const mysql = require('mysql2');

class MysqlRepository implements TodoRepository {
    private pool: any;

    async init(): Promise<void> {
        const {
            MYSQL_HOST: HOST,
            MYSQL_HOST_FILE: HOST_FILE,
            MYSQL_USER: USER,
            MYSQL_USER_FILE: USER_FILE,
            MYSQL_PASSWORD: PASSWORD,
            MYSQL_PASSWORD_FILE: PASSWORD_FILE,
            MYSQL_DB: DB,
            MYSQL_DB_FILE: DB_FILE,
        } = process.env;

        const host = HOST_FILE ? fs.readFileSync(HOST_FILE) : HOST;
        const user = USER_FILE ? fs.readFileSync(USER_FILE) : USER;
        const password = PASSWORD_FILE
            ? fs.readFileSync(PASSWORD_FILE)
            : PASSWORD;
        const database = DB_FILE ? fs.readFileSync(DB_FILE) : DB;

        await waitPort({
            host,
            port: 3306,
            timeout: 10000,
            waitForDns: true,
        });

        this.pool = mysql.createPool({
            connectionLimit: 5,
            host,
            user,
            password,
            database,
            charset: 'utf8mb4',
        });

        return new Promise((acc, rej) => {
            this.pool.query(
                'CREATE TABLE IF NOT EXISTS todo_items (id varchar(36), name varchar(255), completed boolean) DEFAULT CHARSET utf8mb4',
                (err: Error | null) => {
                    if (err) return rej(err);

                    console.log(`Connected to mysql db at host ${HOST}`);
                    acc();
                },
            );
        });
    }

    async teardown(): Promise<void> {
        return new Promise((acc, rej) => {
            this.pool.end((err: Error | null) => {
                if (err) rej(err);
                else acc();
            });
        });
    }

    async getItems(): Promise<TodoItem[]> {
        return new Promise((acc, rej) => {
            this.pool.query(
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
            this.pool.query(
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
            this.pool.query(
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
            this.pool.query(
                'UPDATE todo_items SET name=?, completed=? WHERE id=?',
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
            this.pool.query(
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

module.exports = { MysqlRepository };
