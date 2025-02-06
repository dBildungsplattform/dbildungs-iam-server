import { randomInt } from 'node:crypto';

const NUMBERS: string = '0123456789';
const SYMBOLS: string = '+-*/%&!?@$#';

const stamm: string[] = [
    'Sommer',
    'Winter',
    'Herbst',
    'Blumen',
    'Wolken',
    'Himmel',
    'Planet',
    'Freunde',
    'Familie',
    'Brunnen',
    'Gebirge',
    'Inseln',
    'Koffer',
    'Laterne',
    'Lichtung',
    'Fahrrad',
    'Garten',
    'Schule',
    'Strasse',
    'Fenster',
    'Treppe',
    'Flasche',
    'Bahnhof',
    'Schatten',
    'Taschen',
    'Computer',
    'Kalender',
    'Museum',
    'Kamera',
    'Station',
];

function randomChar(str: string): string {
    return str.charAt(randomInt(str.length));
}

/**
 * Generates a random password with the following rules:
 * - At least one number
 * - At least one symbol
 *
 * Passwords will always be at least 8 characters long, to fulfill these rules
 * @param length The length of the password
 */
export function generatePassword(): string {
    let password: string = '';
    password += stamm[randomInt(stamm.length)]; // Start with a random word
    password += randomChar(NUMBERS); // One number
    password += randomChar(SYMBOLS); // One symbol

    return password;
}
