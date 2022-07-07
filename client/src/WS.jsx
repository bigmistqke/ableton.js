const PORT = {
  ws: 8080,
  wss: 443,
  http: 4000,
};

const WS = function (url, wss = false) {
  let ws;

  this.send = (topic, data) => {
    if (ws.readyState === 3) {
      ws.close();
      ws = new WebSocket(URL.ws);
      console.log("re-connect");

      // wait until new connection is open
      while (ws.readyState !== 1) {
        ws.send(JSON.stringify([topic, data]));
      }
    } else {
      ws.send(JSON.stringify([topic, data]));
    }
  };

  this.onreceive = () => {}; // this function is being used as an event-emitter

  this.connect = (url) => {
    try {
      ws = new WebSocket(
        `${wss ? "wss" : "ws"}://${url}:${wss ? PORT.wss : PORT.ws}`,
        "echo-protocol"
      );
      ws.addEventListener("message", (event) => {
        const [topic, data] = JSON.parse(event.data);
        this.onreceive(topic, data);
      });
    } catch (err) {
      console.error(err);
      return false;
    }
  };
};

export default WS;
