import { Migration } from '@mikro-orm/migrations';

export class Migration20250805125327 extends Migration {
    public async up(): Promise<void> {
        this.addSql('alter type "organisations_typ_enum" add value if not exists \'LMS\';');

        this.addSql('alter table "organisation" add column "lernmanagementsystem" text[] null;');

        this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'LMS_VERWALTEN\';');
    }

    public override async down(): Promise<void> {
        this.addSql('alter table "organisation" drop column "lernmanagementsystem";');

        this.addSql(
            'alter type "rollen_system_recht_enum" add value if not exists \'PERSONEN_SERVICEPROVIDERN_ZUWEISEN\';',
        );
    }
}
