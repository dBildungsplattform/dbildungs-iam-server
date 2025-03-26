import { Migration } from '@mikro-orm/migrations';

export class Migration20250218095358 extends Migration {
    public async up(): Promise<void> {
        this.addSql("create type \"meldung_status_enum\" as enum ('VEROEFFENTLICHT', 'NICHT_VEROEFFENTLICHT');");
        this.addSql(
            'create table "meldung" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "inhalt" varchar(2000) not null, "status" "meldung_status_enum" not null default \'NICHT_VEROEFFENTLICHT\', "revision" int not null default 1, constraint "meldung_pkey" primary key ("id"));',
        );

        this.addSql('alter table "personenkontext" alter column "organisation_id" drop default;');
        this.addSql(
            'alter table "personenkontext" alter column "organisation_id" type uuid using ("organisation_id"::text::uuid);',
        );
        this.addSql('alter table "personenkontext" alter column "organisation_id" set not null;');
        this.addSql(
            'alter table "personenkontext" add constraint "personenkontext_organisation_id_foreign" foreign key ("organisation_id") references "organisation" ("id") on update cascade;',
        );

        this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'SCHULPORTAL_VERWALTEN\';');

        this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'HINWEISE_BEARBEITEN\';');
    }

    public override async down(): Promise<void> {
        this.addSql('drop table if exists "meldung" cascade;');

        this.addSql('alter table "personenkontext" drop constraint "personenkontext_organisation_id_foreign";');

        this.addSql('alter table "personenkontext" alter column "organisation_id" drop default;');
        this.addSql(
            'alter table "personenkontext" alter column "organisation_id" type uuid using ("organisation_id"::text::uuid);',
        );
        this.addSql('alter table "personenkontext" alter column "organisation_id" drop not null;');

        this.addSql('drop type "meldung_status_enum";');
    }
}
