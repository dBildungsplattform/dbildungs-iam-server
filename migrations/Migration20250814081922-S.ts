import { Migration } from '@mikro-orm/migrations';

export class Migration20250814081922 extends Migration {
    public override async up(): Promise<void> {
        this.addSql(
            'create table "rollenmapping" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "rolle_id" uuid not null, "service_provider_id" uuid not null, "map_to_lms_rolle" varchar(255) not null, constraint "rollenmapping_pkey" primary key ("id"));',
        );

        this.addSql(
            'alter table "rollenmapping" add constraint "rollenmapping_rolle_id_foreign" foreign key ("rolle_id") references "rolle" ("id") on update cascade;',
        );
        this.addSql(
            'alter table "rollenmapping" add constraint "rollenmapping_service_provider_id_foreign" foreign key ("service_provider_id") references "service_provider" ("id") on update cascade;',
        );

        this.addSql(
            'alter type "organisations_typ_enum" add value if not exists \'SONSTIGE ORGANISATION / EINRICHTUNG\';',
        );

        this.addSql('alter table "organisation" alter column "lernmanagementsystem" drop default;');
        this.addSql(
            'alter table "organisation" alter column "lernmanagementsystem" type uuid using ("lernmanagementsystem"::text::uuid);',
        );
    }

    public override async down(): Promise<void> {
        this.addSql('drop table if exists "rollenmapping" cascade;');

        this.addSql(
            'alter table "organisation" alter column "lernmanagementsystem" type text using ("lernmanagementsystem"::text);',
        );

        this.addSql(
            'alter type "organisations_typ_enum" add value if not exists \'"SONSTIGE ORGANISATION / EINRICHTUNG"\';',
        );

        this.addSql(
            'alter table "organisation" alter column "lernmanagementsystem" type text[] using ("lernmanagementsystem"::text[]);',
        );

        this.addSql('alter type "service_provider_kategorie_enum" add value if not exists \'LMS\';');
    }
}
