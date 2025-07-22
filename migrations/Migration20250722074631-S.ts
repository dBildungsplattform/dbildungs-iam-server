import { Migration } from '@mikro-orm/migrations';

export class Migration20250722074631 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            'alter table "organisation" add constraint "organisation_administriert_von_foreign" foreign key ("administriert_von") references "organisation" ("id") on update cascade on delete set null;',
        );
        this.addSql(
            'alter table "organisation" add constraint "organisation_zugehoerig_zu_foreign" foreign key ("zugehoerig_zu") references "organisation" ("id") on update cascade on delete set null;',
        );
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "organisation" drop constraint "organisation_administriert_von_foreign";');
        this.addSql('alter table "organisation" drop constraint "organisation_zugehoerig_zu_foreign";');
    }
}
