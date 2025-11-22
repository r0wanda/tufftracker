import ip from 'ip';
import QRCode from 'qrcode';
import express from 'express';
import WaitEvent from './WaitEvent.js';
import Tracker from './Tracker.js';

const root = import.meta.dirname;

export interface LatLon {
    lat: number;
    lon: number;
    id: string;
}

export default class StopEmitter extends WaitEvent {
    track: Tracker;
    constructor(t: Tracker) {
        super();
        this.track = t;
        const app = express();
        app.get('/', (req, res) => {
            res.sendFile('./stop.html', { root });
        });
        app.get('/cb', (req, res) => {
            res.sendFile('./stopcb.html', { root });
            const la = req.query.lat?.toString();
            const lo = req.query.lon?.toString();
            const id = req.query.id?.toString();
            if (!la || !lo || !id) throw new Error('Latitude/longitude invalid');
            this.emit('latlon', {
                lat: parseFloat(la),
                lon: parseFloat(lo),
                id
            });
        });
        app.get('/stops', (req, res) => {
            const data = this.track.stopData[req.query.id?.toString() ?? ''];
            if (data) {
                res.json({
                    code: 'data',
                    data
                });
            } else {
                res.status(503).json({
                    code: 'nah',
                    data: null
                });
            }
        });
        app.get('/cbfin', (req, res) => {
            res.sendFile('./stopcbfin.html', { root });
            const id = req.query.stop?.toString();
            if (!id) throw new Error('Invalid stop');
            this.emit('newStop', id);
        });
        app.listen(8080, () => {
            const url = `http://${ip.address()}:8080/`;
            QRCode.toString(url, (err, qr) => {
                if (err) {
                    this.emit('error', err);
                    return;
                }
                this.emit('ready', qr, url);
            });
        });
    }
}