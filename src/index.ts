import dotenv from 'dotenv';
import OneBusAway from 'onebusaway-sdk';
dotenv.config();

class Tracker extends OneBusAway {
    constructor() {
        super({
            apiKey: process.env.OBA_API_KEY
        });
    }
}