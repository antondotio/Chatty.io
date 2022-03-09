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
      showUpdateModal: false,
    }

    this.sendMessage = this.sendMessage.bind(this);
    this.receivedMessage = this.receivedMessage.bind(this);
    this.enterPressed = this.enterPressed.bind(this);
    this.handleUserSubmit = this.handleUserSubmit.bind(this);
    this.handleMessageChange = this.handleMessageChange.bind(this);
    this.handleUserUpdateClick = this.handleUserUpdateClick.bind(this);
    this.handleUserUpdateSubmit = this.handleUserUpdateSubmit.bind(this);
  }

  componentDidMount() {
    this.socket = socketIOClient(SERVER);

    this.socket.on('successful connection', (body) => {
      this.setSession(body.user);

      this.setState({
        onlineUsers: body.onlineUsers,
        messages: body.history,
        showModal: false,
        showUpdateModal: false,
      });
    })

    this.socket.on('failed connection', (body) => {
      if(body.type === 'username'){
        alert('Username already exists!');
      } else if (body.type === 'color'){
        alert('Invalid hex color!');
      }
    })


    this.socket.on('new user connected', (body) => {
      this.receivedMessage(body.message);
      this.setState({
        onlineUsers: body.onlineUsers,
      });
    })

    this.socket.on('message received', (message) => {
      this.receivedMessage(message);
    })

    this.socket.on('user disconnected', (body) => {
      this.receivedMessage(body.message);
      this.setState({
        onlineUsers: body.onlineUsers,
      });
    })

    this.socket.on('user updated', (body) => {
      this.setState({
        onlineUsers: body.onlineUsers,
        messages: body.history,
      });
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
      color: sessionStorage.getItem('color'),
      message: this.state.message,
      id: sessionStorage.getItem('id'),
    };
    this.socket.emit('chat message', messageObject);
    this.setState({
      message: '',
    });
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

  handleUserUpdateClick() {
    this.setState({
      showUpdateModal: true
    })
  }

  handleUserUpdateSubmit(event) {
    event.preventDefault();
    let newName = event.target.name.value;
    let newColor = event.target.color.value;
    let newProfile = { id: sessionStorage.getItem('id'), username: newName, color: newColor };
    
    if(newName === '' && newColor === ''){
      this.setState({
        showUpdateModal: false,
      });
      return;
    } else {
      this.socket.emit('update profile', newProfile);
    }

  }

  handleUserSubmit(event){
    event.preventDefault();  
    let username = event.target.name.value;
    let color = event.target.color.value;
    const user = {username: username, color: color};
    this.socket.emit('connect new user', user); 
  }

  render() {
    return (
      <div className='page'>
        <ReactModal className='modal' isOpen={this.state.showModal} contentLabel='modal' ariaHideApp={false}>
          <form className='modalForm' onSubmit={this.handleUserSubmit}>
            <h2>Login</h2>

            <label>
              Enter a username, or leave blank for a random username:
            </label>
            <input type='text' name='name'></input>
            Enter a 6-digit color hexcode, or leave blank for default color:
            <input type='text' name='color'></input>
            <input type='submit' value='Submit' />
          </form>
        </ReactModal>
        <ReactModal className='modal' isOpen={this.state.showUpdateModal} contentLabel='modal' ariaHideApp={false}>
          <form className='modalForm' onSubmit={this.handleUserUpdateSubmit}>
            <h2>Update Profile</h2>
            <label>
              Enter a new username:
            </label>
            <input type='text' name='name'></input>
            Enter a new 6-digit color hexcode:
            <input type='text' name='color'></input>
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
        <div className='sidebar-wrapper'>
          <SideBar onlineUsers={this.state.onlineUsers}></SideBar>
          <button className='profile' onClick={this.handleUserUpdateClick}>Update Profile</button>
        </div>
      </div>
    );
  }

}

export default App;
