import { Migration } from '@mikro-orm/migrations';

export class Migration20241204132353 extends Migration {
    public async up(): Promise<void> {
        this.addSql('alter type "import_status_enum" add value if not exists \'FINISHED\';');

        this.addSql(
            'alter table "importdataitem" add column "username" varchar(255) null, add column "password" varchar(255) null;',
        );
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "importdataitem" drop column "username", drop column "password";');
    }
}
