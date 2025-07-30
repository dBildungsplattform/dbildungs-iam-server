import { Migration } from '@mikro-orm/migrations';

export class Migration20250730072309 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            'alter type "organisations_typ_enum" add value if not exists \'SONSTIGE ORGANISATION / EINRICHTUNG\';',
        );

        this.addSql(
            'alter table "email_address" alter column "status" type "email_address_status_enum" using ("status"::"email_address_status_enum");',
        );
        this.addSql('alter table "email_address" alter column "status" set not null;');

        this.addSql('alter type "rollen_art_enum" add value if not exists \'PORTALADMIN\';');

        this.addSql('alter type "rollen_system_recht_enum" add value if not exists \'LMS_VERWALTEN\';');

        this.addSql('alter type "service_provider_kategorie_enum" add value if not exists \'LMS\';');

        this.addSql('alter table "service_provider" alter column "requires2fa" drop default;');
        this.addSql(
            'alter table "service_provider" alter column "requires2fa" type boolean using ("requires2fa"::boolean);',
        );
        this.addSql('alter table "service_provider" alter column "requires2fa" set not null;');
    }

    public override async down(): Promise<void> {
        this.addSql(
            'alter table "email_address" alter column "status" type "email_address_status_enum" using ("status"::"email_address_status_enum");',
        );
        this.addSql('alter table "email_address" alter column "status" drop not null;');

        this.addSql(
            'alter type "organisations_typ_enum" add value if not exists \'"SONSTIGE ORGANISATION / EINRICHTUNG"\';',
        );

        this.addSql('alter table "service_provider" alter column "requires2fa" type bool using ("requires2fa"::bool);');
        this.addSql('alter table "service_provider" alter column "requires2fa" set default false;');
        this.addSql('alter table "service_provider" alter column "requires2fa" drop not null;');
    }
}
