import { IsArray } from 'class-validator';

export class PortalConfig {
    @IsArray()
    public readonly LIMITED_ROLLENART_ALLOWLIST: string[] | undefined;
}
