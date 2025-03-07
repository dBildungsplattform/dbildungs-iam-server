import { randomInt } from 'node:crypto';

const NUMBERS: string = '0123456789';
const SYMBOLS: string = '+-*/%&!?@$#';

const stamm: string[] = [
    'Bruder',
    'Daumen',
    'Gaumen',
    'Graben',
    'Gräser',
    'Häuser',
    'Kleider',
    'Kräuter',
    'Leiter',
    'Pflaume',
    'Schafe',
    'Schaukel',
    'Schule',
    'Schuhe',
    'Straßen',
    'Sträucher',
    'Traube',
    'Träume',
    'Brüten',
    'Duschen',
    'Fragen',
    'Knobeln',
    'Laufen',
    'Quaken',
    'Radeln',
    'Rodeln',
    'Schlafen',
    'Schmeißen',
    'Sprudeln',
    'Streiten',
    'Stören',
    'Kleine',
    'Briefe',
    'Fieber',
    'Fliege',
    'Friese',
    'Kiefer',
    'Kiesel',
    'Kriege',
    'Riegel',
    'Schiene',
    'Spiegel',
    'Spiele',
    'Stiefel',
    'Wiesel',
    'Ziegel',
    'Zwiebel',
    'Dienen',
    'Fliegen',
    'Fließen',
    'Gießen',
    'Kriegen',
    'Quieken',
    'Riechen',
    'Rieseln',
    'Schieben',
    'Schmieren',
    'Siegen',
    'Sprießen',
    'Ziehen',
    'Zielen',
    'Bieder',
    'Schiefe',
    'Sieben',
    'Wieder',
    'Bilder',
    'Burgen',
    'Dornen',
    'Dorsche',
    'Felder',
    'Ferkel',
    'Garten',
    'Henkel',
    'Herzen',
    'Kinder',
    'Kirsche',
    'Laster',
    'Mantel',
    'Marder',
    'Muskel',
    'Rinder',
    'Winter',
    'Würmer',
    'Wurzel',
    'Zirkel',
    'Basteln',
    'Danken',
    'Dürfen',
    'Färben',
    'Hängen',
    'Kürzen',
    'Lüften',
    'Melden',
    'Rosten',
    'Senken',
    'Tanzen',
    'Turnen',
    'Winken',
    'Zünden',
    'Dunkel',
    'Gestern',
    'Hinten',
    'Sondern',
    'Früchte',
    'Spechte',
    'Strümpfe',
    'Flechten',
    'Krächzen',
    'Schimpfen',
    'Schrumpfen',
    'Stampfen',
    'Albern',
    'Flamme',
    'Hammer',
    'Hummel',
    'Klammer',
    'Koffer',
    'Kutter',
    'Lämmer',
    'Löffel',
    'Mutter',
    'Pfanne',
    'Qualle',
    'Rassel',
    'Rippen',
    'Ritter',
    'Roller',
    'Schiffe',
    'Schlitten',
    'Schlösser',
    'Schlüssel',
    'Schwimmer',
    'Sessel',
    'Sonnen',
    'Teller',
    'Trommel',
    'Waffel',
    'Wippen',
    'Bellen',
    'Betteln',
    'Bitten',
    'Brummen',
    'Fallen',
    'Flattern',
    'Gönnen',
    'Knabbern',
    'Kribbeln',
    'Paddeln',
    'Prellen',
    'Rappeln',
    'Rennen',
    'Schwimmen',
    'Sollen',
    'Besser',
    'Bitter',
    'Blasse',
    'Glatte',
    'Grelle',
    'Knappe',
    'Krumme',
    'Schlimme',
    'Starre',
    'Bäcker',
    'Brücke',
    'Dächer',
    'Flecken',
    'Flocke',
    'Glatze',
    'Glocke',
    'Knochen',
    'Rücken',
    'Schlange',
    'Spange',
    'Spritze',
    'Tasche',
    'Wecker',
    'Hocken',
    'Lachen',
    'Machen',
    'Schmatzen',
    'Sitzen',
    'Ticken',
    'Zucken',
    'Zwicken',
    'Lecker',
    'Locker',
    'Schicke',
    'Schmucke',
    'Spitze',
    'Trocken',
    'Drehen',
    'Glühen',
    'Sprühen',
    'Stehen',
    'Bohrer',
    'Hühner',
    'Lehrer',
    'Rahmen',
    'Stühle',
    'Zahlen',
    'Dehnen',
    'Fahren',
    'Fehlen',
    'Föhnen',
    'Fühlen',
    'Gähnen',
    'Mahlen',
    'Nehmen',
    'Prahlen',
    'Schnee',
    'Apfelsine',
    'Camping',
    'Computer',
    'Gardine',
    'Kantine',
    'Krokodil',
    'Lokomotive',
    'Margarine',
    'Ökosystem',
    'Pyramide',
    'Theater',
    'Thermometer',
    'Vampir',
    'Zylinder',
    'Hübsch',
    'Typisch',
    'Dänemark',
    'Deichlämmer',
    'Fischbrötchen',
    'Friesisch',
    'Grenze',
    'Gezeiten',
    'Hering',
    'Krabben',
    'Labskaus',
    'Landzunge',
    'Leuchttürme',
    'Marine',
    'Muscheln',
    'Nordfriesland',
    'Norden',
    'Norddeutschland',
    'Nordsee',
    'Nordseekrabben',
    'Ostsee',
    'Plattdeutsch',
    'Räucherfisch',
    'Robben',
    'SchleswigHolstein',
    'Seeluft',
    'Seepferdchen',
    'Segelboot',
    'Strandkorb',
    'Strände',
    'Strandpromenade',
    'Strömung',
    'Sturmflut',
    'Wasser',
    'Wattenmeer',
    'Wattwanderung',
    'Wattwurm',
    'Wellen',
    'Hemden',
    'Mäntel',
    'Packen',
    'Päckchen',
    'Passen',
    'Tragen',
    'Waschen',
    'Wäscht',
    'Größer',
    'Schwarz',
    'Weiter',
    'Bücher',
    'Fernseher',
    'Fernsehen',
    'Freund',
    'Freundin',
    'Fußball',
    'Fußbälle',
    'Wunsch',
    'Wünsche',
    'Wünschen',
    'Können',
    'Lernen',
    'Möchten',
    'Schwamm',
    'Geschwommen',
    'Singen',
    'Spielen',
    'Trinken',
    'Fenster',
    'Kreide',
    'Papier',
    'Schere',
    'Telefon',
    'Whiteboard',
    'Läufer',
    'Rechnen',
    'Schläft',
    'Schneiden',
    'Schreiben',
    'Schreibt',
    'Zeigen',
    'Butter',
    'Durstig',
    'Flasche',
    'Frucht',
    'Frühstück',
    'Gemüse',
    'Hunger',
    'Hungrig',
    'Nahrung',
    'Ernähren',
    'Zucker',
    'Backen',
    'Helfen',
    'Schmecken',
    'Scharf',
    'Schärfe',
    'Süßigkeit',
    'Abende',
    'August',
    'Dezember',
    'Dienstag',
    'Donnerstag',
    'Februar',
    'Frühling',
    'Geburt',
    'Geburtstag',
    'Herbst',
    'Januar',
    'Kalender',
    'Minute',
    'Mittag',
    'Mittwoch',
    'Nachmittag',
    'Nächte',
    'November',
    'Oktober',
    'Ostern',
    'Sekunde',
    'Sommer',
    'Sonnabend',
    'Sonntag',
    'Stunde',
    'Urlaub',
    'Weihnachten',
    'Zukunft',
    'Zukünftig',
    'Aufwachen',
    'Aufwecken',
    'Häufig',
    'Haufen',
    'Plötzlich',
    'Verspäten',
    'Täglich',
    'Erstens',
    'Morgen',
    'Nachts',
    'Gewitter',
    'Himmel',
    'Temperatur',
    'Wetter',
    'Frieren',
    'Heizen',
    'Heizung',
    'Regnen',
    'Scheinen',
    'Apfelbaum',
    'Bilderbuch',
    'Briefmarke',
    'Butterbrot',
    'Deckenlampe',
    'Halskette',
    'Handgelenk',
    'Handschuhe',
    'Hausnummer',
    'Kaffeekanne',
    'Käsekuchen',
    'Kleiderschrank',
    'Nummernschild',
    'Taschenlampe',
    'Tischdecke',
    'Winterjacke',
    'Kletterwand',
    'Laufschuhe',
    'Schwimmhalle',
    'Singvogel',
    'Suchmaschine',
    'Wartezimmer',
    'Waschmaschine',
    'Hochhaus',
    'Kleingarten',
    'Kühlschrank',
    'Geheimnis',
    'Erkenntnis',
    'Mondschein',
    'Handtuch',
    'Flugzeug',
];

function randomChar(str: string): string {
    return str.charAt(randomInt(str.length));
}

/**
 * Generates a random password with the following rules:
 * - At least two numbers
 * - At least one symbol
 *
 * Passwords will always be at least 8 characters long, to fulfill these rules
 * @param length The length of the password
 */
export function generatePassword(): string {
    let password: string = '';
    password += stamm[randomInt(stamm.length)]; // Start with a random word
    password += randomChar(NUMBERS); // One number
    password += randomChar(NUMBERS); // One number
    password += randomChar(SYMBOLS); // One symbol

    return password;
}
