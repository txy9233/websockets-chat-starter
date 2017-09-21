const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

const app = http.createServer(onRequest).listen(port);
console.log(`Listening on 127.0.0.1: ${port}`);

const io = socketio(app);

const users = [];
const onJoined = (sock) => {
  const socket = sock;

  socket.on('join', (data) => {
    const joinMsg = {
      name: 'server',
      msg: `There are ${Object.keys(users).length} users online`,
    };

    users.push(data);
    // console.dir(users);
    socket.name = data.name;
    socket.emit('msg', joinMsg);

    socket.join('room1');

    const response = {
      name: 'server',
      msg: `${data.name} has joined the room.`,
    };

    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${data.name} joined`);

    socket.emit('msg', { name: 'server', msg: 'You joined the room' });
  });
};

const onMsg = (sock) => {
  const socket = sock;

  socket.on('msg', (data) => {
    socket.name = data.name;
    socket.msg = data.msg;
    io.sockets.in('room1').emit('msg', { name: socket.name, msg: socket.msg });
  });
};

const onDisconnect = (sock) => {
  const socket = sock;

  socket.on('disconnect', () => {
    const response = {
      name: 'server',
      msg: `${socket.name} has left the room.`,
    };

    socket.broadcast.to('room1').emit('msg', response);

    console.log(`${socket.name} left`);

    socket.emit('msg', { name: 'server', msg: 'You left the room' });


    for (let i = 0; i < users.length; i++) {
      const leaver = users[i];

      if (leaver.name === socket.name) {
        users.splice(index, 1);
        console.log(`There are ${users.length} users left`);
      }
    }
  });
};

io.sockets.on('connection', (socket) => {
  console.log('started');

  onJoined(socket);
  onMsg(socket);
  onDisconnect(socket);
});

console.log('Websocket server started');
