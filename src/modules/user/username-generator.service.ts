import { Injectable } from '@nestjs/common';

@Injectable()
export class UsernameGeneratorService {
    public generateUsername(firstname: string, lastname: string): string | Error {
        if (firstname.length == 0) {
            return new Error('First name not given');
        }
        if (lastname.length == 0) {
            return new Error('Last name not given');
        }
        return this.cleanString(firstname)[0] + this.cleanString(lastname);
    }

    private cleanString(name: string): string {
        const lowerCaseInput: string = name.toLowerCase();

        const normalizedString: string = [...lowerCaseInput]
            .map((s: string) => {
                switch (s) {
                    case 'ä':
                        return 'ae';
                    case 'ö':
                        return 'oe';
                    case 'ü':
                        return 'ue';
                    case 'ß':
                        return 'ss';
                    default:
                        return s;
                }
            })
            .join('')
            .normalize('NFKD');
        return normalizedString.replace(new RegExp('[^\u0061-\u007a]', 'g'), '');
    }
}
