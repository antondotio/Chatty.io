const e = require('express');
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
        socket.emit('failed connection', { type: 'username' });
      } 
    });

    let validColor = true;
    if(!validateHexColor(newUser.color) && newUser.color !== ''){
      validColor = false;
      socket.emit('failed connection', { type: 'color' });
    }

    if(!exists && validColor){
      if(newUser.username === ''){
        newUser.username = generateUsername();
      } 
      if(newUser.color === ''){
        newUser.color = '000000';
      }
      const user = { id: socket.id, username: newUser.username, color: newUser.color };
      onlineUsers.push(user);
      
      let ownMessage = { id: 'alert', body: 'Welcome to the chat, ' + newUser.username + '!'}
      let otherMessage =  { id: 'alert', body: newUser.username + ' has joined the chat!' }
      socket.emit('successful connection', {user: user, onlineUsers: onlineUsers, history: history});
      socket.emit('message received', ownMessage);
      
      saveMessage(otherMessage);
      socket.broadcast.emit('new user connected', { message: otherMessage, onlineUsers: onlineUsers });
    }
  });

  socket.on('chat message', (messageObject) => {
    let timeStamp = new Date().toLocaleString('en-US', { hour12: true });
    let otherMessage = { id: messageObject.id, body: messageObject.message, username: messageObject.username, timeStamp: timeStamp, color: messageObject.color};

    saveMessage(otherMessage)
    io.emit('message received', otherMessage);
  });
  
  socket.on('disconnect', () => {
    console.log('user disconnected');
    let disconnectedUser;
    onlineUsers.forEach((user, index) => {
      if(user.id === socket.id){
        disconnectedUser = user
        onlineUsers.splice(index, 1);
      }
    });

    if(disconnectedUser) {
      let message =  { id: 'alert', body: disconnectedUser.username + ' has disconnected from the chat!' }
      saveMessage(message);
      socket.broadcast.emit('user disconnected', { message: message, onlineUsers: onlineUsers });
    }
  });

  socket.on('update profile', (newProfile) => {
    console.log('Updating Profile');
    let username;
    let color;
    onlineUsers.forEach((user) => {
      if(user.id === newProfile.id){
        username = user.username;
        color = user.color;
      }
    });
    
    let exists = false;
    onlineUsers.forEach((user) => {
      if(user.username === newProfile.username){
        exists = true;
        socket.emit('failed connection', { type: 'username' });
      }
    });

    let validColor = true;
    if(!validateHexColor(newProfile.color) && newProfile.color !== ''){
      validColor = false;
      socket.emit('failed connection', { type: 'color' });
    }

    if(!exists && validColor){
      onlineUsers.forEach((user, index) => {
        if(user.id === newProfile.id && newProfile.username !== ''){
          onlineUsers.at(index).username = newProfile.username;
        }
        if(user.id === newProfile.id && newProfile.color !== ''){
          onlineUsers.at(index).color = newProfile.color;
        }
      });

      history.forEach((message, index) => {
        if(message.id === newProfile.id && newProfile.username !== ''){
          history.at(index).username = newProfile.username;
        }
        if(message.id === newProfile.id && newProfile.color !== ''){
          history.at(index).color = newProfile.color;
        }
      })

      if(newProfile.username !== ''){
        username = newProfile.username;
      }
      if(newProfile.color !== ''){
        color = newProfile.color;
      }

      let updatedUser = { id: socket.id, username: username, color: color};
      socket.emit('successful connection', {user: updatedUser, onlineUsers: onlineUsers, history: history});
      io.emit('user updated', { onlineUsers: onlineUsers, history: history });
    }
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