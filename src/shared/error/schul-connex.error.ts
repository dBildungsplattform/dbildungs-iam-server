import { HttpException } from '@nestjs/common';

type SchulConnexErrorProps = {
    code: number;
    subcode: string;
    titel: string;
    beschreibung: string;
};

export class SchulConnexError extends HttpException {
    public constructor(props: SchulConnexErrorProps) {
        super(props, props.code);
    }
}
