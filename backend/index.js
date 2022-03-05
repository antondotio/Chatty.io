const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const PORT = 8000;
const SAVED_MESSAGES_LIMIT = 200;


// structured as {id: socket.id, username: username, color: '#000000' };
let onlineUsers = []
let history = [];

io.on('connection', (socket) => {

  socket.on('connect new user', (newUser) => {
    if(newUser.username === ''){
      newUser.username = generateUsername();
    } 
    if(validateHexColor(newUser.color)){
      newUser.color = '000000';
    }
    const user = { id: socket.id, username: newUser.username, color: newUser.color };
    onlineUsers.push(user);
    
    let ownMessage = { id: 'alert', body: 'Welcome to the chat, ' + username + '!'}
    let otherMessage =  { id: 'alert', body: username + ' has joined the chat!' }
    socket.emit('new connection', {user: user, onlineUsers: onlineUsers, history: history});
    socket.emit('message received', ownMessage);

    saveMessage(otherMessage);
    socket.broadcast.emit('new user connected', { message: otherMessage, onlineUsers: onlineUsers });
  });

  socket.on('chat message', (msg) => {
    io.emit('chat message', msg);
  });

});

// FUNCTIONS
function generateUsername(){
  let base = 'User';
  let randomNum = Math.floor(Math.random() * Math.floor(99));
  let randomUsername = base + randomNum;
  while(onlineUsers.find(user => user.username === randomUsername)){
    randomUsername = base + Math.floor(Math.random() * Math.floor(99));
  }
  if (!onlineUsers.find(u => u.username === randomUsername)) {
    return randomUsername;
  }
}

function saveMessage(message) {
  // Max 200 messages, remove the last if over the limit
  if (messageHistory.length === SAVED_MESSAGES_LIMIT) {
    messageHistory.shift();
  }
  messageHistory.push(message);
}

function validateHexColor(code) {
  if (code.length !== 6) return false;
  if (code.match(RegExp("[0-9A-F]{6}", "i"))) return true;
  return false;
}

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});