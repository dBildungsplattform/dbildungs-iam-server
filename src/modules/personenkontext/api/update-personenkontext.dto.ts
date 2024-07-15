import { AutoMap } from '@automapper/classes';
import { Jahrgangsstufe, Personenstatus } from '../domain/personenkontext.enums.js';

export class UpdatePersonenkontextDto {
    public id!: string;

    public readonly referrer?: string;

    public readonly personenstatus?: Personenstatus;

    public readonly jahrgangsstufe?: Jahrgangsstufe;

    public readonly revision!: string;
}
