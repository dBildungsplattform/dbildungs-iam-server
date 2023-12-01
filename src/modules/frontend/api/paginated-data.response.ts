import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiProperty, ApiResponseOptions, getSchemaPath } from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
    public items!: T[];

    @ApiProperty()
    public offset!: number;

    @ApiProperty()
    public limit!: number;

    @ApiProperty()
    public total!: number;

    public constructor(offset: number, limit: number, total: number, items: T[]) {
        this.offset = offset;
        this.limit = limit;
        this.total = total;
        this.items = items;
    }
}

export const ApiOkResponsePaginated = <DataDto extends Type<unknown>>(
    dataDto: DataDto,
    options?: Omit<ApiResponseOptions, 'schema' | 'type'>,
): (<TFunction extends () => unknown, Y>(
    target: object | TFunction,
    propertyKey?: string | symbol | undefined,
    descriptor?: TypedPropertyDescriptor<Y> | undefined,
) => void) =>
    applyDecorators(
        ApiExtraModels(PaginatedResponseDto, dataDto),
        ApiOkResponse({
            ...options,
            schema: {
                allOf: [
                    { $ref: getSchemaPath(PaginatedResponseDto) },
                    {
                        properties: {
                            items: {
                                type: 'array',
                                items: { $ref: getSchemaPath(dataDto) },
                            },
                        },
                    },
                ],
            },
        }),
    );
