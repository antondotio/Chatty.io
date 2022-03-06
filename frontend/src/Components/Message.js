import React from 'react';
import '../App.css';

class Message extends React.Component {
  componentDidMount() {
    if(this.text) {
      this.text.innerHTML = this.props.message.body;
    }
  }
}