const express = require('express');
const app = express();
const http = require('http');
const server = http.createServer(app);
const io = require('socket.io')(server, {
  cors: {
    origin: 'http://localhost:3000'
  }
});
const PORT = 8000;
const SAVED_MESSAGES_LIMIT = 200;

// structured as {id: socket.id, username: username, color: '#000000' };
let onlineUsers = []
let history = [];

io.on('connection', (socket) => {

  console.log('client connected');

  socket.on('connect new user', (newUser) => {
    console.log('connecting new user');
    let exists = false;
    onlineUsers.forEach((user) => {
      if(newUser.username === user.username){
        exists = true;
        console.log('user already exists');
        socket.emit('failed connection', { type: 'new' });
      } 
    });

    if(!exists){
      if(newUser.username === ''){
        newUser.username = generateUsername();
      } 
      if(!validateHexColor(newUser.color)){
        newUser.color = '#000000';
      }
      const user = { id: socket.id, username: newUser.username, color: '#' + newUser.color };
      onlineUsers.push(user);
      
      let ownMessage = { id: 'alert', body: 'Welcome to the chat, ' + newUser.username + '!'}
      let otherMessage =  { id: 'alert', body: newUser.username + ' has joined the chat!' }
      socket.emit('successful connection', {user: user, onlineUsers: onlineUsers, history: history});
      socket.emit('message received', ownMessage);
      
      saveMessage(otherMessage);
      console.log(history);
      socket.broadcast.emit('new user connected', { message: otherMessage, onlineUsers: onlineUsers });
    }
  });

  socket.on('connect existing user', (existingUser) => {
    console.log('reconnecting existing user');

    const prevId = existingUser.id;
    const color = existingUser.color;
    let username = existingUser.username;
    let exists = false;

    onlineUsers.forEach((user) => {
      if (username === user.username){
        exists = true;
      }
    })

    if(exists) {
      const user = { id: socket.id, username: username, color: color };
      
      let ownMessage = { id: 'alert', body: 'Welcome back to the chat, ' + existingUser.username + '!'}
      let otherMessage =  { id: 'alert', body: existingUser.username + ' has rejoined the chat!' }
      socket.emit('successful connection', {user: user, onlineUsers: onlineUsers, history: history});
      socket.emit('message received', ownMessage);
  
      saveMessage(otherMessage);
      socket.broadcast.emit('existing user reconnected', { message: otherMessage, onlineUsers: onlineUsers, prevId: prevId, newId: socket.id });
    
    } else {
      console.log('user does not exists');
      socket.emit('failed connection', { type: 'exists' });
    }
  })

  socket.on('chat message', (messageObject) => {
    let timeStamp = new Date().toLocaleString('en-US', { hour12: true });
    let message = { id: messageObject.id, body: messageObject.message, username: messageObject.username, timeStamp: timeStamp};
    saveMessage(message);

    io.emit('message received', message);
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
  if (history.length === SAVED_MESSAGES_LIMIT) {
    history.shift();
  }
  history.push(message);
}

function validateHexColor(code) {
  if (code.length !== 6) return false;
  if (code.match(RegExp("[0-9A-F]{6}", "i"))) return true;
  return false;
}

server.listen(PORT, () => {
  console.log(`server is running on port ${PORT}`);
});