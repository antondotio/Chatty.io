import React from 'react';
import './App.css';
import socketIOClient from 'socket.io-client';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      onlineUsers: [],
      message: "",
    }

  }

  componentDidMount() {
    this.socket = socketIOClient();

    this.socket.io('connect', () => {
      let username = sessionStorage.getItem("username");
      let color = sessionStorage.getItem("color");
      let id = sessionStorage.getItem("id");

      const user = { id: id, username: username, color: color}
      if(username !== ''){
        this.socket.emit('connect existing user', user)
      } else {
        this.socket.emit('connnect new user', user)
      }
    })

    this.socket.on('successful connection', body => {
      this.setSession(body.user);

      this.setState({
        onlineUsers: body.onlineUsers,
        messages: body.messageHistory,
      });
    })

    this.socket.on('new user connected', body => {
      this.receivedMessage(body.message);
      this.setState({
        onlineUsers: body.onlineUsers,
      });
    })

    this.socket.on('message received', message => {
      this.receivedMessage(message);
    })
  }

  componentWillUnmount(){
    this.socket.close();
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

  render() {
    return (
      <div className="App">

      </div>
    );
  }

}

export default App;
