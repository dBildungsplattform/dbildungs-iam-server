import { RollenArt, RollenMerkmal, RollenSystemRecht } from '../../../modules/rolle/domain/rolle.enums.js';

export class RolleFile {
    public id?: number;

    public name!: string;

    public administeredBySchulstrukturknoten!: number;

    public rollenart!: RollenArt;

    public merkmale!: RollenMerkmal[];

    public systemrechte!: RollenSystemRecht[];
}
