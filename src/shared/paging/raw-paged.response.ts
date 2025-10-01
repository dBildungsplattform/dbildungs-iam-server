import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, ApiProperty, ApiResponseOptions, getSchemaPath } from '@nestjs/swagger';
import { Paged } from './paged.js';

export class RawPagedResponse<T> {
    @ApiProperty()
    public readonly total: number;

    @ApiProperty()
    public readonly offset: number;

    @ApiProperty()
    public readonly limit: number;

    @ApiProperty()
    public readonly items: T[];

    public constructor(page: Paged<T>) {
        this.total = page.total;
        this.offset = page.offset;
        this.limit = page.limit;
        this.items = page.items;
    }
}

export const ApiOkResponsePaginated = <DataDto extends Type<unknown>>(
    dataDto: DataDto,
    options?: Omit<ApiResponseOptions, 'schema' | 'type'>,
): (<TFunction extends () => unknown, Y>(
    target: object | TFunction,
    propertyKey: string | symbol | undefined,
    descriptor: TypedPropertyDescriptor<Y> | undefined,
) => void) =>
    applyDecorators(
        ApiExtraModels(RawPagedResponse, dataDto),
        ApiOkResponse({
            ...options,
            schema: {
                allOf: [
                    { $ref: getSchemaPath(RawPagedResponse) },
                    {
                        required: ['items'],
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
