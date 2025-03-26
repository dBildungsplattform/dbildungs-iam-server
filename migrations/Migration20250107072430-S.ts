import { Migration } from '@mikro-orm/migrations';

export class Migration20250107072430 extends Migration {
    public async up(): Promise<void> {
        // Remove old BTree-indices
        this.addSql('drop index "personenkontext_person_id_index";');
        this.addSql('drop index "personenkontext_organisation_id_index";');

        // Create hash-indices for all person, organisation and rolle
        this.addSql('create index "personenkontext_person_id_index" on "personenkontext" using hash ("person_id");');
        this.addSql(
            'create index "personenkontext_organisation_id_index" on "personenkontext" using hash ("organisation_id");',
        );
        this.addSql('create index "personenkontext_rolle_id_index" on "personenkontext" using hash ("rolle_id");');
    }

    public override async down(): Promise<void> {
        // Remove all indices
        this.addSql('drop index "personenkontext_person_id_index";');
        this.addSql('drop index "personenkontext_organisation_id_index";');
        this.addSql('drop index "personenkontext_rolle_id_index";');

        // Recreate the old BTree indices on person and organisation
        this.addSql('create index "personenkontext_person_id_index" on "personenkontext" ("person_id");');
        this.addSql('create index "personenkontext_organisation_id_index" on "personenkontext" ("organisation_id");');
    }
}
