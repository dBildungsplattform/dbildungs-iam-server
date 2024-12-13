import { TimestampedEntity } from '../../../persistence/timestamped.entity.js';
import { ArrayType, Entity, ManyToOne, Property, Ref } from '@mikro-orm/core';
import { ImportVorgangEntity } from './import-vorgang.entity.js';

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
}
