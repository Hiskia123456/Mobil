const WebSocket = require("ws");
const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

let players = {};
let peluruList = [];
let nextSpawn = 0;

class Mobil {
  constructor(x,y,color){this.x=x;this.y=y;this.color=color;this.angle=0;this.width=40;this.height=20;}
  maju(){this.x+=Math.cos(this.angle)*2;this.y+=Math.sin(this.angle)*2;}
  mundur(){this.x-=Math.cos(this.angle)*2;this.y-=Math.sin(this.angle)*2;}
  belokKiri(){this.angle-=0.05;} belokKanan(){this.angle+=0.05;}
}

class Peluru {
  constructor(x,y,a){this.x=x;this.y=y;this.angle=a;this.speed=6;}
  update(){this.x+=Math.cos(this.angle)*this.speed;this.y+=Math.sin(this.angle)*this.speed;}
}

wss.on("connection",(ws)=>{
  ws.id=Math.random().toString(36).substr(2,5);
  let color=nextSpawn===0?"blue":"green";
  let spawn=nextSpawn===0?{x:300,y:350}:{x:300,y:50};
  nextSpawn=(nextSpawn+1)%2;

  players[ws.id]=new Mobil(spawn.x,spawn.y,color);

  ws.send(JSON.stringify({type:"init",id:ws.id,color:color,spawn:spawn}));

  ws.on("message",(msg)=>{
    const data=JSON.parse(msg);
    const p=players[ws.id];
    if(!p) return;
    if(data.type==="input"){
      if(data.key==="ArrowUp") p.maju();
      if(data.key==="ArrowDown") p.mundur();
      if(data.key==="ArrowLeft") p.belokKiri();
      if(data.key==="ArrowRight") p.belokKanan();
      if(data.key==="shoot"){
        peluruList.push(new Peluru(p.x,p.y,p.angle));
      }
    }
  });

  ws.on("close",()=>{
    delete players[ws.id];
  });
});

// Loop server: update peluru & broadcast snapshot
setInterval(()=>{
  peluruList.forEach(pl=>pl.update());
  let snapshot={
    type:"snapshot",
    players:Object.entries(players).map(([id,p])=>({id,color:p.color,x:p.x,y:p.y,angle:p.angle})),
    peluru:peluruList.map(pl=>({x:pl.x,y:pl.y,angle:pl.angle}))
  };
  wss.clients.forEach(client=>{
    if(client.readyState===WebSocket.OPEN){
      client.send(JSON.stringify(snapshot));
    }
  });
},100);

console.log(`Server running on port ${PORT}`);
