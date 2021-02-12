import React from 'react';
import { Route } from 'react-router-dom';
import TodoList from './Components/TodoList/TodoList';
import LandingPage from './Components/LandingPage/LandingPage';

class App extends React.Component {
  render() {
    return (
      <div>
        <Route path="/:slug" component={TodoList} />
        <Route exact path="/" component={LandingPage} />
      </div>
    );
  }
}

export default App;