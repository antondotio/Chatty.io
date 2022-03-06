import React from 'react';
import './App.css';
import socketIOClient from 'socket.io-client';
import ReactModal from 'react-modal';
const SERVER = 'http://127.0.0.1:8080';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      messages: [],
      onlineUsers: [],
      message: "",
      showModal: true,
    }
    
    this.handleUserSubmit = this.handleUserSubmit.bind(this);
  }

  componentDidMount() {
    this.socket = socketIOClient(SERVER);
    console.log(this.socket);
    this.socket.on("connect_error", (err) => {
      console.log(`connect_error due to ${err.message}`);
    });

    this.socket.on('connection', () => {
      console.log(`I'm connected with the back-end`);
    });

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

  setSession(user) {
    sessionStorage.setItem("username", user.username);
    sessionStorage.setItem("color", user.color);
    sessionStorage.setItem("id", user.id);
  }

  handleUserSubmit(event){
    let username = event.target.name.value;
    let color = event.target.color.value;

    if(event.target.userType.value === "newUser"){
      // TODO CHECK IF USER EXISTS
      const user = {username: username, color: color};

      this.socket.emit('connnect new user', user);

    } else {
      this.state.onlineUsers.forEach((user) => {
        if(user === username){
          const user = { id: sessionStorage.getItem("id"), username: username, color: color};
          this.socket.emit('connect existing user', user);
        }
      })
    }
    this.setState({ showModal: false });

    event.preventDefault();
  }

  render() {
    return (
      <div className="page">
        <ReactModal isOpen={this.state.showModal} contentLabel="modal" ariaHideApp={false}>
          <form onSubmit={this.handleUserSubmit}>
            <label>
              Enter a username, or leave blank for a random username:
              <br/>
              <input type="text" name="name"></input>
            </label>
            <br/>
            <br/>
            <label>
              Enter a 6-digit color hexcode, or leave blank for default color:
              <br/>
              #<input type="text" name="color"></input>
            </label>"
            <br/>
            <br/>
            <input type="radio" value="newUser" name="userType" defaultChecked={true} /> New User
            <input type="radio" value="existingUser" name="userType" /> Existing User
            <br/>
            <br/>
            <input type="submit" value="Submit" />

          </form>
          <br/>
        </ReactModal>
        <div className="chat">
        </div>
      </div>
    );
  }

}

export default App;
