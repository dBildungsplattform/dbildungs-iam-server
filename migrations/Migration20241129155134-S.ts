import { Migration } from '@mikro-orm/migrations';

export class Migration20241129155134 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            "create type \"import_status_enum\" as enum ('STARTED', 'VALID', 'INVALID', 'INPROGRESS', 'CANCELLED', 'COMPLETED', 'FAILED');",
        );
        this.addSql(
            'create table "importvorgang" ("id" uuid not null, "created_at" timestamptz not null, "updated_at" timestamptz not null, "import_by_person_id" uuid null, "import_by_username" varchar(255) not null, "rolle_id" uuid null, "rollename" varchar(255) not null, "organisation_id" uuid null, "organisationsname" varchar(255) not null, "data_item_count" int not null default 0, "status" "import_status_enum" not null, constraint "importvorgang_pkey" primary key ("id"));',
        );

        this.addSql(
            'alter table "importdataitem" add constraint "importdataitem_importvorgang_id_foreign" foreign key ("importvorgang_id") references "importvorgang" ("id") on update cascade;',
        );
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "importdataitem" drop constraint "importdataitem_importvorgang_id_foreign";');

        this.addSql('drop table if exists "importvorgang" cascade;');

        this.addSql('drop type "import_status_enum";');
    }
}
