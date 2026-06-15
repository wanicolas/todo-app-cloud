import type { Knex } from 'knex';

export async function up(knex: Knex): Promise<void> {
    const hasColumn = await knex.schema.hasColumn('todo_items', 'user_id');
    if (!hasColumn) {
        // Nullable so existing rows (without an owner) survive the migration.
        await knex.schema.alterTable('todo_items', (table) => {
            table.string('user_id', 36).nullable().index();
        });
    }
}

export async function down(knex: Knex): Promise<void> {
    const hasColumn = await knex.schema.hasColumn('todo_items', 'user_id');
    if (hasColumn) {
        await knex.schema.alterTable('todo_items', (table) => {
            table.dropColumn('user_id');
        });
    }
}
