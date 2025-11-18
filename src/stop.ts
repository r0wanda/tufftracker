import ip from 'ip';
import QRCode from 'qrcode';
import express from 'express';

const root = import.meta.dirname;

export default function findStop() {
    const app = express();
    app.get('/', (req, res) => {
        res.sendFile('./stop.html', { root });
    });
    return new Promise(r => {
        app.get('/cb', (req, res) => {
            res.sendFile('./stopcb.html', { root });
            r({
                lat: req.query.lat,
                lon: req.query.lon
            });
        });
        app.listen(8080, () => {
            const url = `http://${ip.address()}:8080/`;
            QRCode.toString(url, (err, url) => {
                console.log(url);
            });
        });
    });
}