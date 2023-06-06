import React from "react";

import ImsThinPresentation from "./Ims-Thin-Presentation";

import "./ims.css";

import { ImsActions } from "./actions/ims-actions";
import { ImsData } from "./data/ims-data";

import { AdobeIMSThin}  from "@identity/imslib-thin";

export default class ImsThinNpm extends React.Component {

  imsActions = null;
  imsEvents = null;

  adobeid = {
    client_id: "IMSLibJSTestClient",
    locale: "en_US",
    scope: "AdobeID,openid,creative_cloud",
    environment: "stg1",
    key: "adobeIMS",
    logsEnabled: true,
  };

  state = {
      initialized: true,
      imslibData: null,
  };

  componentDidMount() {

    const imsData = new ImsData(this.onStateChanged, this.adobeid);

    this.adobeIMS = new AdobeIMSThin(imsData.adobeIdData);

    this.imsActions = new ImsActions(this.adobeIMS, imsData);

    this.adobeIMS.initialize();
  }

  onStateChanged = (newState) => {
    const fragmentValues = this.imsActions.getFragmentValues();
    const token = fragmentValues['access_token'];
    if(token) {
        this.setState({ imslibData: {
              ...newState,
                token,
                isSignedInUser: true,
          }});
    } else
      this.setState({imslibData : newState});
  };

  render() {
    if (!this.state.initialized || !this.imsActions) {
      return <div>LOADING...</div>;
    }

    return (
        <ImsThinPresentation
    imsActions={this.imsActions}
    imslibData={this.state.imslibData} />
  );
  }
}
