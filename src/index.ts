import dotenv from 'dotenv';
import OneBusAway from 'onebusaway-sdk';
import findStop from './stop.js';
dotenv.config();

class Tracker extends OneBusAway {
    constructor() {
        super({
            apiKey: process.env.OBA_API_KEY
        });
    }
}

console.log(await findStop());
