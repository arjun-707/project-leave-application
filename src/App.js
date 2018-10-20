import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import { LeaveComponent } from "./leave-register/leave-form";

class App extends Component {
  render() {
    return (
      <div className="App">
        <LeaveComponent />
      </div>
    );
  }
}

export default App;
