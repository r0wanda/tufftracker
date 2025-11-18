import ip from 'ip';
import express from 'express';

export default function findStop() {
    const app = express();
    app.get('/', (req, res) => {
        res.sendFile('stop.html');
    });
    return new Promise(r => {
        app.get('/cb', (req, res) => {
            res.sendFile('stopcb.html');
            r({
                lat: req.query.lat,
                lon: req.query.lon
            });
        });
        app.listen(8080, () => {
            const url = `http://${ip.address()}:8080/`;
        })
    });
}