const express = require('express');
const app = express();
const http = require('http');
const WebSocket = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');
const player = require('play-sound');

// Inisialisasi dataGift
let dataGift = ''; // Inisialisasi awal

// Username of someone who is currently live
let tiktokUsername = "postingan.id";

// Create a new wrapper object and pass the username
let tiktokLiveConnection = new WebcastPushConnection(tiktokUsername);

// Connect to the chat (await can be used as well)
tiktokLiveConnection.connect().then(state => {
  console.info(`Connected to roomId ${state.roomId}`);
}).catch(err => {
  console.error('Failed to connect', err);
});

// Mengatur server HTTP
// const server = http.createServer((req, res) => {
//   res.writeHead(200, { 'Content-Type': 'text/plain' });
//   res.end('WebSocket server is running');
// });

const wss = new WebSocket.Server({ noServer: true });

wss.on('connection', (socket) => {
  socket.on('message', (message) => {
    // Di sini, Anda bisa menerima pesan dari frontend
    console.log(`Received: ${message}`);
  });

  // Mengirim data ke sisi frontend saat ada peristiwa gift
  tiktokLiveConnection.on('gift', data => {
    const dataGift = `<span class="avatar"><img src="${data.profilePictureUrl}" alt="Avatar"></span> <span class="text-output"><b>${data.nickname} (userId:${data.userId})</b> : sends <span class="avatar"><img src="${data.giftPictureUrl}" alt="Avatar"></span></span>`;
    socket.send(dataGift);

    player.play(__dirname + "/thankyou.mp3");

  });

  tiktokLiveConnection.on('chat', data => {
    const dataGift = `<span class="avatar"><img src="${data.profilePictureUrl}" alt="Avatar"></span> <span class="text-output"><b>${data.nickname}</b> : ${data.comment}</span>`;
    socket.send(dataGift);
  })
});

app.use(express.static(__dirname + '/gift.html'));

const port = 3000;

// Menampilkan file HTML saat rute '/' diakses
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/gift.html');
});

const server = app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});

// Mengintegrasikan WebSocket dengan server HTTP Express.js
server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit('connection', ws, request);
  });
});