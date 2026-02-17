const WebSocket = require("ws");
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

let nextSpawn = 0;

wss.on("connection", (ws) => {
  ws.id = Math.random().toString(36).substr(2,5);
  ws.color = nextSpawn === 0 ? "blue" : "green";
  ws.spawn = nextSpawn === 0 ? {x:300,y:350} : {x:300,y:50};
  nextSpawn = (nextSpawn+1)%2;

  ws.send(JSON.stringify({type:"init", id:ws.id, color:ws.color, spawn:ws.spawn}));

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);
    data.id = ws.id;
    data.color = ws.color;

    // broadcast snapshot ke semua client lain
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(data));
      }
    });
  });

  ws.on("close", () => {
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify({type:"leave", id:ws.id}));
      }
    });
  });
});

console.log(`WebSocket server running on port ${PORT}`);console.log(`WebSocket server running on port ${PORT}`);
