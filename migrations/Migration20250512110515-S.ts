import { Migration } from '@mikro-orm/migrations';

export class Migration20250512110515 extends Migration {
    public async up(): Promise<void> {
        this.addSql(
            'alter type "rollen_system_recht_enum" add value if not exists \'LANDESBEDIENSTETE_SUCHEN_UND_HINZUFUEGEN\';',
        );

        this.addSql(
            'alter type "rollen_system_recht_enum" add value if not exists \'EINGESCHRAENKT_NEUE_BENUTZER_ERSTELLEN\';',
        );
    }
}
