import { Migration } from '@mikro-orm/migrations';

export class Migration20260506083444 extends Migration {
    async up(): Promise<void> {
        this.addSql('alter table "rollenerweiterung" drop constraint "rollenerweiterung_rolle_id_foreign";');

        this.addSql(
            'alter table "rollenerweiterung" add constraint "rollenerweiterung_rolle_id_foreign" foreign key ("rolle_id") references "rolle" ("id") on update cascade on delete cascade;',
        );
    }

    override async down(): Promise<void> {
        this.addSql('alter table "rollenerweiterung" drop constraint "rollenerweiterung_rolle_id_foreign";');

        this.addSql(
            'alter table "rollenerweiterung" add constraint "rollenerweiterung_rolle_id_foreign" foreign key ("rolle_id") references "rolle" ("id") on update cascade;',
        );
    }
}
