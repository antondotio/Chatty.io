import React from 'react';
import './App.css';
import socketIOClient from 'socket.io-client';
import ReactModal from 'react-modal';
import Chat from './Components/Chat';
import SideBar from './Components/SideBar';

const SERVER = 'http://localhost:8000';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      onlineUsers: [],
      message: '',
      showModal: true,
    }

    this.sendMessage = this.sendMessage.bind(this);
    this.receivedMessage = this.receivedMessage.bind(this);
    this.enterPressed = this.enterPressed.bind(this);
    this.handleUserSubmit = this.handleUserSubmit.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
  }

  componentDidMount() {
    this.socket = socketIOClient(SERVER);

    this.socket.on('successful connection', (body) => {
      this.setSession(body.user);

      this.setState({
        onlineUsers: body.onlineUsers,
        messages: body.history,
        showModal: false,
      });
    })

    this.socket.on('failed connection', (body) => {
      if(body.type === 'new') {
        alert('Username already exists!');
      } else {
        alert('User does not exist, please create a new user!');
      }
    })

    this.socket.on('new user connected', (body) => {
      this.receivedMessage(body.message);
      this.setState({
        onlineUsers: body.onlineUsers,
      });
    })

    this.socket.on('existing user reconnected', (body) => {
      this.receivedMessage(body.message);
      this.updateMessageIds(body.prevId, body.newId)
      this.setState({
        onlineUsers: body.onlineUsers,
      });
    })

    this.socket.on('message received', (message) => {
      this.receivedMessage(message);
    })
  }

  componentWillUnmount(){
    this.socket.close();
  }
  
  setSession(user) {
    sessionStorage.setItem('username', user.username);
    sessionStorage.setItem('color', user.color);
    sessionStorage.setItem('id', user.id);
  }

  receivedMessage(message) {
    let newMessages = this.state.messages;
    if (newMessages) {
      newMessages.push(message);
    } else {
      newMessages = [message];
    }
    this.setState({
      messages: newMessages,
    })
  }

  sendMessage(event) {
    event.preventDefault();
    if (this.state.message === '') return;
    const messageObject = {
      username: sessionStorage.getItem('username'),
      message: this.state.message,
      id: sessionStorage.getItem('id'),
    };

    let detectedCommand = this.detectCommand(messageObject);
    if(detectedCommand) {
      this.socket.emit(detectedCommand.command, detectedCommand.argument);
    } else {
      this.socket.emit('chat message', messageObject);
    }
    this.setState({
      message: '',
    });
  }

  detectCommand(messageObject) {
    if(!messageObject.message.match(RegExp('^/'))) return;

    let messageArr = messageObject.message.split(RegExp('\\s{1,}'));
    
    // TODO implement these
    if (messageArr[0].match(RegExp('/nickcolor'))) {
      messageArr.shift();
      return {command: 'change color', argument: messageArr};
    }
    if (messageArr[0].match(RegExp('/nick'))) {
      messageArr.shift();
      return {command: 'change username', argument: messageArr}
    }

    return {command: 'unknown', argument: { body: this.state.message, username: this.state.username }}
  }

  updateMessageIds(prevId, newId) {
    if (!prevId || !newId) return;
    let updatedMessages = this.state.messages;
    if (updatedMessages) {
      updatedMessages.forEach(m => {
        if (m.id === prevId) {
          m.id = newId;
          if (m.username) {
            delete m.username;
          }
        }
      });
    }
    this.setState({
      messages: updatedMessages,
    })
  }

  enterPressed(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.sendMessage(event);
    }
  }
  
  handleMessageChange(event) {
    this.setState({
      message: event.target.value
    });
  }

  handleUserSubmit(event){
    event.preventDefault();  
    let username = event.target.name.value;
    let color = event.target.color.value;
    if(event.target.userType.value === 'newUser'){
      const user = {username: username, color: color};
      this.socket.emit('connect new user', user); 

    } else {
      const user = { id: sessionStorage.getItem('id'), username: username, color: color};
      this.socket.emit('connect existing user', user);
    }
    
  }

  render() {
    return (
      <div className='page'>
        <ReactModal className='modal' isOpen={this.state.showModal} contentLabel='modal' ariaHideApp={false}>
          <form className='modalForm' onSubmit={this.handleUserSubmit}>
            <label>
              Enter a username, or leave blank for a random username:
            </label>
            <input type='text' name='name'></input>
            Enter a 6-digit color hexcode, or leave blank for default color:
              <input type='text' name='color'></input>
            <label>
              <input className='radio' type='radio' value='newUser' name='userType' defaultChecked={true} /> New User
            </label>
            <label>
              <input type='radio' value='existingUser' name='userType'/> Existing User
            </label>
            <input type='submit' value='Submit' />
          </form>
        </ReactModal>
        <div className='chat-wrapper'>
          <Chat messages={this.state.messages} users={this.state.onlineUsers}></Chat>
          <form onSubmit={this.sendMessage} className='chatForm'>
            <textarea value={this.state.message} onChange={this.handleMessageChange} onKeyPress={e => this.enterPressed(e)} placeholder='Type a message...' />
            <button type='submit' name='Submit'>Send</button>
          </form>
        </div>
      </div>
    );
  }

}

export default App;
