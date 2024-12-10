import { Migration } from '@mikro-orm/migrations';

export class Migration20241206143703 extends Migration {
    public async up(): Promise<void> {
        this.addSql('alter type "import_status_enum" add value if not exists \'FINISHED\';');

        this.addSql('alter table "importvorgang" alter column "data_item_count" drop default;');
        this.addSql(
            'alter table "importvorgang" alter column "data_item_count" type int using ("data_item_count"::int);',
        );

        this.addSql(
            'alter table "importdataitem" add column "username" varchar(255) null, add column "password" varchar(255) null;',
        );
    }

    public override async down(): Promise<void> {
        this.addSql(
            'alter table "importvorgang" alter column "data_item_count" type int using ("data_item_count"::int);',
        );
        this.addSql('alter table "importvorgang" alter column "data_item_count" set default 0;');

        this.addSql('alter table "importdataitem" drop column "username", drop column "password";');
    }
}
