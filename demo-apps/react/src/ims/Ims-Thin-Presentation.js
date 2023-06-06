import React from "react";
import Button from "./components/Button";

import "./ims.css";

import ReactJson from "react-json-view";

const ImsThinPresentation = (props) => (
  <div className="row">
    <div>
      <Button handler={props.imsActions.signIn} text={"Sign In"}></Button>
    </div>

    <div>
      <Button handler={props.imsActions.signOut} text={"Sign Out"}></Button>
    </div>

    <ReactJson src={props.imslibData} />
  </div>
);

export default ImsThinPresentation;
