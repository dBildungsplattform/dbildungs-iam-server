import { AutoMap } from '@automapper/classes';
import { Jahrgangsstufe, Personenstatus } from '../domain/personenkontext.enums.js';

export class UpdatePersonenkontextDto {
    @AutoMap()
    public id!: string;

    @AutoMap()
    public readonly referrer?: string;

    @AutoMap(() => String)
    public readonly personenstatus?: Personenstatus;

    @AutoMap(() => String)
    public readonly jahrgangsstufe?: Jahrgangsstufe;

    @AutoMap()
    public readonly revision!: string;
}
