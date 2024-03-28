import { ApiProperty } from '@nestjs/swagger';
import { PersonPermissions } from '../domain/person-permissions.js';

export class UserinfoResponse {
    @ApiProperty()
    public sub: string;

    @ApiProperty({ nullable: true })
    public name?: string;

    @ApiProperty({ nullable: true })
    public given_name?: string;

    @ApiProperty({ nullable: true })
    public family_name?: string;

    @ApiProperty({ nullable: true })
    public middle_name?: string;

    @ApiProperty({ nullable: true })
    public nickname?: string;

    @ApiProperty({ nullable: true })
    public preferred_username?: string;

    @ApiProperty({ nullable: true })
    public profile?: string;

    @ApiProperty({ nullable: true })
    public picture?: string;

    @ApiProperty({ nullable: true })
    public website?: string;

    @ApiProperty({ nullable: true })
    public email?: string;

    @ApiProperty({ nullable: true })
    public email_verified?: boolean;

    @ApiProperty({ nullable: true })
    public gender?: string;

    @ApiProperty({ nullable: true })
    public birthdate?: string;

    @ApiProperty({ nullable: true })
    public zoneinfo?: string;

    @ApiProperty({ nullable: true })
    public locale?: string;

    @ApiProperty({ nullable: true })
    public phone_number?: string;

    @ApiProperty({ nullable: true })
    public updated_at?: number;

    public constructor(info: PersonPermissions) {
        this.sub = info.personFields.keycloakUserId!;
        this.name = `${info.personFields.vorname} ${info.personFields.familienname}`;
        this.given_name = info.personFields.vorname;
        this.family_name = info.personFields.familienname;
        this.nickname = info.personFields.rufname;
        this.preferred_username = info.personFields.username;
        this.gender = info.personFields.geschlecht;
        this.birthdate = info.personFields.geburtsdatum?.toISOString();
        this.updated_at = info.personFields.updatedAt.getTime() / 1000;
    }
}
