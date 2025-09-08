import { Rolle } from '../domain/rolle.js';

export class RolleNameIdResponse {
    public id: string;

    public name: string;

    public constructor(rolle: Rolle<true>) {
        this.id = rolle.id;
        this.name = rolle.name;
    }
}
