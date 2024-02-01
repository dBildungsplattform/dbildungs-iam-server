import { RollenArt, RollenMerkmal } from './rolle.enums.js';

export class Rolle<WasPersisted extends boolean> {
    private constructor(
        public id: Persisted<string, WasPersisted>,
        public createdAt: Persisted<Date, WasPersisted>,
        public updatedAt: Persisted<Date, WasPersisted>,
        public name: string,
        public administeredBySchulstrukturknoten: string,
        public rollenart: RollenArt,
        public merkmale: RollenMerkmal[],
    ) {}

    public static createNew(
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
    ): Rolle<false> {
        return new Rolle(undefined, undefined, undefined, name, administeredBySchulstrukturknoten, rollenart, merkmale);
    }

    public static construct<WasPersisted extends boolean = false>(
        id: string,
        createdAt: Date,
        updatedAt: Date,
        name: string,
        administeredBySchulstrukturknoten: string,
        rollenart: RollenArt,
        merkmale: RollenMerkmal[],
    ): Rolle<WasPersisted> {
        return new Rolle(id, createdAt, updatedAt, name, administeredBySchulstrukturknoten, rollenart, merkmale);
    }

    public addMerkmal(merkmal: RollenMerkmal): void {
        if (!this.merkmale.includes(merkmal)) {
            this.merkmale.push(merkmal);
        }
    }

    public removeMerkmal(merkmal: RollenMerkmal): void {
        const idx: number = this.merkmale.indexOf(merkmal);
        if (idx !== -1) {
            this.merkmale.splice(idx, 1);
        }
    }
}
