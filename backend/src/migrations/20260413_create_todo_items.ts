import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    const exists = await knex.schema.hasTable('todo_items');
    if (!exists) {
        await knex.schema.createTable('todo_items', (table) => {
            table.string('id', 36).primary();
            table.string('name', 255).notNullable();
            table.boolean('completed').defaultTo(false);
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    await knex.schema.dropTableIfExists('todo_items');
}
