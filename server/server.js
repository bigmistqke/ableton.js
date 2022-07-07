const express = require('express');
const cors = require('cors');
const { AbletonWrapper } = require('./AbletonWrapper');
let WebSocket, { WebSocketServer } = require('ws');

const PORTS = {
  ws: 8080,
  http: 4000
}

const a = new AbletonWrapper();

const wss = new WebSocketServer({
  port: PORTS.ws,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

const app = express();
app.use(cors());

app.get('/requestFX', async function (req, res) {
  const map = await a.mapLive();
  res.json(a.serializeMap());
})

wss.on('connection', async function connection(ws) {
  await a.mapLive();
  // console.log(map);


  ws.on('message', function message(json) {
    try {
      const [topic, data] = JSON.parse(json);

      switch (topic) {
        case "fx":
          var [track, fx, par, value] = data;
          a.setFX(track, fx, par, value);
          break;
        case "preset":
          var [track, preset] = data;
          a.setPreset(track, preset);
          break;
        case "play":
          a.playCtrlAtIndex(data);
          break;
        case "hit":
          a.playHitAtIndex(data);
          break;
      }
    } catch (e) {
      console.error(e);
    }
  });
  console.log('this happens');
  ws.send(JSON.stringify(["init", a.serializeMap()]));
});

app.listen(PORTS.http, "0.0.0.0")
