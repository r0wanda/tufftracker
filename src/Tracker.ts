import ch, { type ChalkInstance } from 'chalk';
import fig from 'figlet';
import widestLine from 'widest-line';
import OneBusAway from 'onebusaway-sdk';
import StopEmitter, { type LatLon } from './StopEmitter.js';

interface OkRes {
    code: number;
    text: string;
    data: any;
}

function ok<R extends OkRes>(res: R): R['data'] {
    if (res.code !== 200) throw new Error(`Api responded with code ${res.code} and message "${res.text}"`);
    return res.data;
}

export default class Tracker extends OneBusAway {
    stopCoords: StopEmitter;
    stopId?: string;
    stopTimeout?: NodeJS.Timeout;
    stopData: Record<string, OneBusAway.StopsForLocation.StopsForLocationListResponse.Data>;
    limit: number;
    constructor(limit = -1) {
        super({
            apiKey: process.env.OBA_API_KEY
        });
        this.limit = limit;
        this.stopData = {};
        this.stopCoords = new StopEmitter(this);
        this.stopCoords.on('latlon', async (ll: LatLon) => {
            await this.findStop(ll);
        });
        this.stopCoords.on('newStop', async (id: string) => {
            console.log(id);
            await this.setStop(id);
        });
        this.stopCoords.on('error', err => {
            console.error(err);
        });
        this.stopCoords.on('ready', (qr, url) => {
            console.log(qr);
            console.log(url);
        });
    }
    async findStop(ll: LatLon) {
        console.log(ll);
        const stops = ok(await this.stopsForLocation.list({ ...ll }));
        this.stopData[ll.id] = stops;
        this.stopCoords.emit('stopRes', stops);
    }
    async setStop(id: string) {
        this.stopId = id;
        if (this.stopTimeout) clearInterval(this.stopTimeout);
        this.stopTimeout = setInterval(this.updStatus.bind(this), 5000);
        await this.updStatus();
    }
    async updStatus() {
        const rows = process.stdout.rows;
        const cols = process.stdout.columns;
        const data = await this.arrivalAndDeparture.list(this.stopId!);
        const arrivals = ok(data);
        arrivals.entry.arrivalsAndDepartures.sort((a, b) => a.predictedArrivalTime - b.predictedArrivalTime);
        let cur = 0;
        let res = '';
        for (let i = 0; i < arrivals.entry.arrivalsAndDepartures.length; i++) {
            const ar = arrivals.entry.arrivalsAndDepartures[i];
            if (!ar) continue;
            const txt = await this.render(ar.routeShortName || '?', ar.tripHeadsign, Math.floor((ar.scheduledArrivalTime - data.currentTime) / 1000 / 60), cols, ar.predicted);
            cur += txt[1];
            if (cur > rows) break;
            res += txt[0];
        }
        console.clear();
        console.log(res.trimEnd());
    }
    async render(route: string, sign: string, time: number, cols: number, rt = false): Promise<[string, number]> {
        const opts = {
            font: 'miniwi'
        }

        let routeR = '';
        // rapidride
        const rrEx = / line$/gi;
        let routeC: keyof ChalkInstance = 'green'
        if (route.search(rrEx) >= 0) {
            route = route.replace(rrEx, '');
            routeR = await fig(route, opts);
            routeC = 'red';
        } else {
            routeR = await fig(route, opts);
        }
        //console.log(routeR);

        let timeR = await fig((time < 1 ? 'Now' : time.toString() + 'min'), opts);
        let timeC: keyof ChalkInstance = rt ? 'green' : 'white';
        //console.log(timeR);
        
        let signR = '';
        let routeW = 0;
        let signW = 0;
        let timeW = 0;
        do {
            signR = await fig(sign, opts);
            routeW = widestLine(routeR);
            signW = widestLine(signR);
            timeW = widestLine(timeR);
            let width = routeW + signW + timeW + 4; // for spaces
            if (width > cols) {
                sign = sign.slice(0, -1);
            } else break;
        } while (sign.length > 3);
        let routeA = routeR.split('\n');
        let signA = signR.split('\n');
        let timeA = timeR.split('\n');
        let r = '';
        const max = Math.max(routeA.length, signA.length, timeA.length);
        for (let i = 0; i < max; i++, r += '\n') {
            const routeL = (routeA[i] ?? '').padEnd(routeW + 2, ' ');
            const signL = (signA[i] ?? '').padEnd(signW + 2, ' ');
            const timeL = (timeA[i] ?? '').padEnd(timeW, ' ');
            r += ch[routeC](routeL) + signL + ch[timeC](timeL);
        }
        return [r, max];
    }
}