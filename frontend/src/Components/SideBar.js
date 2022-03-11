import React from 'react';
import '../App.css';

class SideBar extends React.Component {
  
  render () {
    return (
        <div className='sidebar'>
          <h2>Online</h2>
          <div className='users-wrapper'>
            <div style={{ color : '#' + sessionStorage.getItem('color')}}>{sessionStorage.getItem('username')} (You)</div>
            {
              this.props.onlineUsers.map((user, index) => {
                return sessionStorage.getItem('username') === user.username ?
                <div key={index}></div> :
                <div style={{ color : '#' + user.color }} key={index}>{user.username}</div>
              })
            }
          </div>
        </div>
    );
  }
}

export default SideBar;