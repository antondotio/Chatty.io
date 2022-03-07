import React from 'react';
import '../App.css';

class Message extends React.Component {

  render () {
    return (
      <div className={this.props.type}>
        <div className='row' key={this.props.index}>
          { this.props.user.id !== 'alert' ?
            <div>
              <span className='timestamp-text'>{this.props.message.timeStamp}</span>
              &nbsp;&nbsp;
              <span className='username-text' style={{ color : this.props.user.color}}>{this.props.message.username}</span> 
              &nbsp;&nbsp;
              <span className='message-text'>{this.props.message.body}</span> 
            </div>
            :
            <span className='alert-message' style={{ color : this.props.user.color}}>{this.props.message.body}</span>
          }

        </div>
      </div>
    );
  }
}


export default Message;