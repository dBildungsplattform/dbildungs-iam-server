import { Migration } from '@mikro-orm/migrations';

export class Migration20260626103000 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            'alter table "service_provider" add constraint "service_provider_schulstrukturknoten_vidis_angebot_id_unique" unique ("provided_on_schulstrukturknoten", "vidis_angebot_id");',
        );
    }

    public override async down(): Promise<void> {
        this.addSql(
            'alter table "service_provider" drop constraint "service_provider_schulstrukturknoten_vidis_angebot_id_unique";',
        );
    }
}