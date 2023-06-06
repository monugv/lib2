import React from "react";

import "./home.css";

const Home = () => (
    <div className="center-xs">
      <div>
        This is a demo application used to help developers to integrate imslib
        v2
      </div>

      <div>The application contains the following features:</div>
      <ul>
        <li>
          <strong>CDN</strong> (the imslib.js file is read from
          https://auth-stg1.services.adobe.com/imslib/imslib.js)
        </li>

        <li>
          <strong>NPM</strong> (the imslib is installed by using the npm)
        </li>
        <li>
          <strong>Thin</strong> (the imslib.js file is read from
          https://auth-stg1.services.adobe.com/imslib/imslib-thin.js)
        </li>
        <li>
          <strong>Thin (NPM)</strong>
          the thin version of imslib is added by installing the thin package
          library
        </li>
      </ul>

      <div className="container-fluid row">
        <div className="center-xs row mt3">
          <a href="/pages/IMS/imslib2.js/demo-react-app/#/cdn" className="item bgimg bgimg-cdn  cursor-pointer">
            <div className="title">CDN</div>
          </a>

          <a href="/pages/IMS/imslib2.js/demo-react-app/#/npm" className="item bgimg bgimg-npm  cursor-pointer">
            <div className="title">NPM</div>
          </a>

          <a href="/pages/IMS/imslib2.js/demo-react-app/#/thin" className="item bgimg bgimg-thin  cursor-pointer">
            Thin (CDN)
          </a>

          <a
            href="/pages/IMS/imslib2.js/demo-react-app/#/thinnpm"
            className=" item bgimg bgimg-npm  cursor-pointer"
          >
            Thin(NPM)
          </a>
        </div>
      </div>
    </div>
);
export default Home;
