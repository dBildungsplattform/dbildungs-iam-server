import { IsInt, IsOptional, IsString, Max, Min } from "class-validator";

export class HostConfig {
    @IsInt()
    @Min(1024)
    @Max(10000)
    public readonly PORT!: number;

    @IsOptional()
    @IsString()
    public readonly ADDRESS?: string;
}
