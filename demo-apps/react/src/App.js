import React, { Component } from "react";
import {
  HashRouter as Router,
  Redirect,
  Switch,
  Route,
  Link,
} from "react-router-dom";

import './App.css';
import ImsCdn from './ims/Ims-Cdn';
import ImsNpmMultipleClients from './ims/Ims-Npm-Multiple-Clients';

import Home from './ims/Home';
import ImsThin from './ims/Ims-Thin';
import ImsThinNpm from './ims/Ims-Thin-Npm';

class App extends Component {
  /**
   * function used to determine the old_hash value contained into the source
   * @param source {String} represents the input source used to determine the old_hash
   * @returns {String}
   */
  getOldHash = (source) => {
    if (!source) {
      return "";
    }
    const match = source.match("old_hash=(.*?)&from_ims=true");
    if (!match) {
      return "";
    }
    return decodeURIComponent(match[1]);
  };

  render() {
    const oldHash = this.getOldHash(window.location.hash);
    
    return (
      <Router>
        <div>
          <header className="App-header">
            <svg
              className="Gnav-logo-image"
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="17"
              viewBox="0 0 24 20"
              focusable="false"
            >
              <path
                fill="#FF0000"
                d="M15.1,0H24v20L15.1,0z M8.9,0H0v20L8.9,0z M12,7.4L17.6,20h-3.8l-1.6-4H8.1L12,7.4z"
              ></path>
            </svg>
            <h4> Adobe IMS application testing </h4>
          </header>

          <div className="imsweb center-xs">
            <nav>
              <ul className="linear">
                <li>
                  <Link to="/">Home</Link>
                </li>
                <li>
                  <Link to="/cdn">CDN</Link>
                </li>
                <li>
                  <Link to="/npm">NPM</Link>
                </li>
                <li>
                  <Link to="/thin">Thin</Link>
                </li>
                <li>
                  <Link to="/thinnpm">Thin (NPM)</Link>
                </li>
              </ul>
            </nav>

            {/* A <Switch> looks through its children <Route>s and
              renders the first one that matches the current URL. */}
            <Switch>
              <Route path="/cdn" component={ImsCdn}/>
              <Route path="/npm" component={ImsNpmMultipleClients}/>
              <Route path="/thin" component={ImsThin}/>
              <Route path="/thinnpm" component={ImsThinNpm}/>
              <Route path="/" component={Home}/>
            </Switch>
          </div>
        </div>

        {oldHash?  (
            <Redirect push to={`${oldHash}?${window.location.hash}`}></Redirect>
          ): null 
        }

      </Router>
    );
  }
}
export default App;
