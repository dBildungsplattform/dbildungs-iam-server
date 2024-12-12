import { Migration } from '@mikro-orm/migrations';

export class Migration20241212002543 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            'alter table "importdataitem" alter column "username" type varchar(50) using ("username"::varchar(50));',
        );
    }

    public override async down(): Promise<void> {
        this.addSql(
            'alter table "importdataitem" alter column "username" type varchar(255) using ("username"::varchar(255));',
        );
    }
}
