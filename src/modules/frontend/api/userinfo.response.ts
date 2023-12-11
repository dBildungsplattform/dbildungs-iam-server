import { ApiProperty } from '@nestjs/swagger';
import { UserinfoResponse as OpenIdUserinfoResponse } from 'openid-client';

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

    public constructor(info: OpenIdUserinfoResponse) {
        this.sub = info.sub;
        this.name = info.name;
        this.given_name = info.given_name;
        this.family_name = info.family_name;
        this.middle_name = info.middle_name;
        this.nickname = info.nickname;
        this.preferred_username = info.preferred_username;
        this.profile = info.profile;
        this.picture = info.picture;
        this.website = info.website;
        this.email = info.email;
        this.email_verified = info.email_verified;
        this.gender = info.gender;
        this.birthdate = info.birthdate;
        this.zoneinfo = info.zoneinfo;
        this.locale = info.locale;
        this.phone_number = info.phone_number;
        this.updated_at = info.updated_at;
    }
}
