import React from "react";
import Button from "./components/Button";

import "./ims.css";

import ReactJson from "react-json-view";

const ImsPresentation = (props) => (
  <div className="row">
    <div>
      <Button handler={props.imsActions.signIn} text={"Sign In"}></Button>
    </div>

    <div>
      <Button
        handler={props.imsActions.getAccessToken}
        text={"Get Access Token"}
      ></Button>
    </div>

    <div>
      <Button
        handler={props.imsActions.getProfile}
        text={"Get profile"}
      ></Button>
    </div>


    <div>
      <Button
        handler={props.imsActions.getReleaseFlags}
        text={"Get release flags"}
      ></Button>
    </div>

    

    <div>
      <Button
        handler={props.imsActions.refreshToken}
        text={"Refresh Token"}
      ></Button>
    </div>

    <div>
      <Button
        handler={props.imsActions.validateToken}
        text={"Validate Token"}
      ></Button>
    </div>

    <div>
      <Button
        handler={props.imsActions.isSignedInUser}
        text={"Is User Signed In"}
      ></Button>
    </div>

    <div>
      <Button
        handler={props.imsActions.reAuthenticateCheck}
        text={"Reauth (check)"}
      ></Button>
    </div>

    <div>
      <Button
        handler={props.imsActions.reAuthenticateForce}
        text={"Reuth (force)"}
      ></Button>
    </div>

    <div>
      <Button handler={props.imsActions.signOut} text={"Sign Out"}></Button>
    </div>

    <div>
      <Button
        handler={props.imsActions.listSocialProviders}
        text={"ListSocialProvidersSign"}
      ></Button>
    </div>

    <div>
      <Button
        handler={props.imsActions.signInWithSocialProvider}
        text={"signInWithSocialProvider"}
      ></Button>
    </div>

    <div>
      <Button handler={props.imsActions.avatarUrl} text={"avatar url"}></Button>
    </div>

    <ReactJson src={props.imslibData} />
  </div>
);

export default ImsPresentation;
