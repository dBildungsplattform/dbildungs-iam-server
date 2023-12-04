import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserinfoResponse as OpenIdUserinfoResponse } from 'openid-client';

export class UserinfoResponse {
    @ApiProperty()
    public sub: string;

    @ApiPropertyOptional()
    public name?: string;

    @ApiPropertyOptional()
    public given_name?: string;

    @ApiPropertyOptional()
    public family_name?: string;

    @ApiPropertyOptional()
    public middle_name?: string;

    @ApiPropertyOptional()
    public nickname?: string;

    @ApiPropertyOptional()
    public preferred_username?: string;

    @ApiPropertyOptional()
    public profile?: string;

    @ApiPropertyOptional()
    public picture?: string;

    @ApiPropertyOptional()
    public website?: string;

    @ApiPropertyOptional()
    public email?: string;

    @ApiPropertyOptional()
    public email_verified?: boolean;

    @ApiPropertyOptional()
    public gender?: string;

    @ApiPropertyOptional()
    public birthdate?: string;

    @ApiPropertyOptional()
    public zoneinfo?: string;

    @ApiPropertyOptional()
    public locale?: string;

    @ApiPropertyOptional()
    public phone_number?: string;

    @ApiPropertyOptional()
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
