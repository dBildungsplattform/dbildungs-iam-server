/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/typedef */

import express, { type Request, type Response } from 'express';
import fs from 'fs';

const app = express();
const port: number = 10000;

// Für x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// optional: db.json laden
const db = JSON.parse(fs.readFileSync('src/modules/vidis/test-cron-sync/db.json', 'utf-8'));

// 1) OAuth Token Endpoint
app.post('/o/oauth2/token', (_req: Request, res: Response) => {
    res.json({
        access_token: 'mock-access-token',
        token_type: 'Bearer',
        expires_in: 3600,
        scope: 'openid',
    });
});

// 2) VIDIS Angebots-Endpoint
app.get('/o/vidis-rest/v1.0/offers/activated/by-region/:region', (req, res) => {
    const region = req.params.region;

    // wenn du pro Region trennen willst
    const key = `offersActivatedByRegion${region}`;

    if (db[key]) {
        return res.json(db[key]);
    }

    // fallback, falls du nur SH hast
    if (db.offersActivatedByRegionSH) {
        return res.json(db.offersActivatedByRegionSH);
    }

    return res.status(404).json({ message: `No mock data for region ${region}` });
});

app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Mock läuft auf http://localhost:${port}`);
});
