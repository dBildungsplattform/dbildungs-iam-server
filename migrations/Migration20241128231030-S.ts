import { Migration } from '@mikro-orm/migrations';

export class Migration20241128231030 extends Migration {
    public async up(): Promise<void> {
        this.addSql('alter table "importvorgang" drop constraint "importvorgang_pkey";');

        this.addSql('alter table "importvorgang" add constraint "importvorgang_pkey" primary key ("id");');
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "importvorgang" drop constraint "importvorgang_pkey";');

        this.addSql('alter table "importvorgang" add constraint "importvorgang_pkey" primary key ("id", "status");');
    }
}
