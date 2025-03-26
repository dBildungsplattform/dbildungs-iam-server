import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { ArrayType, Entity, Enum, ManyToOne, Property, Ref } from '@mikro-orm/core';
import { ImportVorgangEntity } from './import-vorgang.entity.js';
import { ImportDataItemStatus } from '../domain/importDataItem.enum.js';

@Entity({ tableName: 'importdataitem' })
export class ImportDataItemEntity extends TimestampedEntity {
    @ManyToOne({
        fieldName: 'importvorgang_id',
        columnType: 'uuid',
        ref: true,
        nullable: false,
        entity: () => ImportVorgangEntity,
    })
    public readonly importvorgangId!: Ref<ImportVorgangEntity>;

    @Property()
    public readonly nachname!: string;

    @Property()
    public readonly vorname!: string;

    @Property({ nullable: true })
    public readonly klasse?: string;

    @Property({ nullable: true })
    public personalnummer?: string;

    @Property({ type: ArrayType, nullable: true })
    public validationErrors?: string[];

    @Property({ nullable: true, length: 50 })
    public username?: string;

    @Property({ nullable: true })
    public password?: string;

    @Enum({
        items: () => ImportDataItemStatus,
        nativeEnumName: 'import_data_item_status_enum',
    })
    public status: ImportDataItemStatus = ImportDataItemStatus.PENDING;
}
