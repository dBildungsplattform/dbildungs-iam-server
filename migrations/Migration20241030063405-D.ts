import { Migration } from '@mikro-orm/migrations';

export class Migration20241030063405 extends Migration {
    async up(): Promise<void> {
        this.addSql(
            "update service_provider SET logo_mime_type = 'image/png', logo = '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' WHERE name = 'WebUntis';",
        );
    }

    override async down(): Promise<void> {}
}