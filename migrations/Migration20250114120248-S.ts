import { Migration } from '@mikro-orm/migrations';

export class Migration20250114120248 extends Migration {
    public async up(): Promise<void> {
        this.addSql('alter table "person" add column "ist_technisch" boolean not null default false;');
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "person" drop column "ist_technisch";');
    }
}
