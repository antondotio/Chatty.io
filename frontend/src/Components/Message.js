import React from 'react';
import '../App.css';

class Message extends React.Component {

  render () {
    return (
      <div className={this.props.type}>
        <div className='row' key={this.props.index}>
           { this.props.user.id !== 'alert' ?
            <div className='message-bubble'>
              <span className='username-text' style={{ color : this.props.message.color }}><b>{this.props.message.username}</b></span> 
              <br></br>
              <span className='message-text' ref={(el) => { this.text = el; }}>{this.props.message.body}</span> 
            </div> :
            <span className='alert-message' style={{ color : this.props.user.color }}>{this.props.message.body}</span>
          }
          <br></br>              
          <span className='timestamp-text'>{this.props.message.timeStamp}</span>
        </div>
      </div>
    );
  }
}


export default Message;