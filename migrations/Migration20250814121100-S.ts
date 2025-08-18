import { Migration } from '@mikro-orm/migrations';

export class Migration20250814121100 extends Migration {
    public override async up(): Promise<void> {
        this.addSql(
            'alter type "organisations_typ_enum" add value if not exists \'SONSTIGE ORGANISATION / EINRICHTUNG\';',
        );

        this.addSql('alter table "organisation" alter column "lernmanagementsystem" drop default;');
        this.addSql(
            'alter table "organisation" alter column "lernmanagementsystem" type uuid using ("lernmanagementsystem"::text::uuid);',
        );

        this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'SERVICEPROVIDER_VERWALTEN\';');
    }

    public override async down(): Promise<void> {
        this.addSql(
            'alter table "organisation" alter column "lernmanagementsystem" type text using ("lernmanagementsystem"::text);',
        );

        this.addSql(
            'alter type "organisations_typ_enum" add value if not exists \'"SONSTIGE ORGANISATION / EINRICHTUNG"\';',
        );

        this.addSql(
            'alter table "organisation" alter column "lernmanagementsystem" type text[] using ("lernmanagementsystem"::text[]);',
        );
    }
}
