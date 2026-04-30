import { Migration } from '@mikro-orm/migrations';

export class Migration20260429152753 extends Migration {
    override async up(): Promise<void> {
        this.addSql('alter table "service_provider" add column "logo_id" int null;');
        this.addSql(
            'alter table "service_provider" add constraint logo_or_logo_id_consistency check((logo_id IS NULL AND logo IS NULL) OR (logo_id IS NULL AND logo IS NOT NULL) OR (logo_id IS NOT NULL AND logo IS NULL));',
        );
    }

    override async down(): Promise<void> {
        this.addSql('alter table "service_provider" drop constraint logo_or_logo_id_consistency;');
        this.addSql('alter table "service_provider" drop column "logo_id";');
    }
}
