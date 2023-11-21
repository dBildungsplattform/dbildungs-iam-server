import { HttpException } from '@nestjs/common';

type SchulConnexErrorProps = {
    statusCode: number;
    subcode: string;
    title: string;
    description: string;
};

export class SchulConnexError extends HttpException {
    public constructor(props: SchulConnexErrorProps) {
        super(props, props.statusCode);
    }
}
