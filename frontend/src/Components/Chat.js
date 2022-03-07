import React from 'react';
import '../App.css';
import Message from './Message'
const ALERT_COLOR = '#FFFFFF';

class Chat extends React.Component {

  getUserInfo(message){
    if(message.id === 'alert') {
      return { id: 'alert', username: '', color: ALERT_COLOR}
    }
    if (this.props.users){
      const user = this.props.users.find(user => message.id === user.id);
      if (user) {
        return user;
      }
    }
  }

  scrollToBottom = () => {
    this.end.scrollIntoView({ behavior: 'smooth' });
  }
  
  componentDidMount() {
    this.scrollToBottom();
  }
  
  componentDidUpdate() {
    this.scrollToBottom();
  }

  render() {
    return (
      <div className='message-wrapper'>
        {this.props.messages.map((message, index) => {
          if (message.id === sessionStorage.getItem('id')){
            return <Message key={index} type='outgoing' message={message} user={this.getUserInfo(message)}></Message>
          } else if (message.id !== 'alert'){
            return <Message key={index} type='incoming' message={message} user={this.getUserInfo(message)}></Message>
          } else {
            return <Message key={index} type='alert' message={message} user={this.getUserInfo(message)}></Message>
          }
        })}
        <div ref={(el) => { this.end = el; }}></div>
      </div>
    );
  }
}


export default Chat;