import { BaseEntity, Entity, ManyToOne, PrimaryKeyProp, Property, Rel } from '@mikro-orm/core';
import { EmailEntity } from './email.entity.js';

@Entity({ tableName: 'email_address' })
export class EmailAddressEntity extends BaseEntity {
    @ManyToOne({
        columnType: 'uuid',
        fieldName: 'email_id',
        ref: true,
        entity: () => EmailEntity,
    })
    public email!: Rel<EmailEntity>;

    @Property({ primary: true, nullable: false, unique: true })
    public address!: string;

    @Property({ nullable: false })
    public enabled!: boolean;

    public [PrimaryKeyProp]?: ['address'];
}
