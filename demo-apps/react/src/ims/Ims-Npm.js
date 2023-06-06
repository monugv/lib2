import React from "react";
import ImsPresentation from "./Ims-Presentation";

import "./ims.css";

import { ImsActions } from "./actions/ims-actions";
import { ImsData } from "./data/ims-data";
import { AdobeIMS } from "@identity/imslib";

export default class ImsNpm extends React.Component {
  imsActions = null;
  imsEvents = null;
  constructor(props) {
    super();

    const { adobeid } = props;
    const imsData = new ImsData(this.onStateChanged, adobeid);

    this.adobeIMS = new AdobeIMS(imsData.adobeIdData);

    this.state = {
      initialized: true,
      imslibData: imsData.imslibData,
    };

    this.imsActions = new ImsActions(this.adobeIMS, imsData);

    this.adobeIMS.initialize();
  }

  onStateChanged = (newState) => {
    this.setState({ imslibData: newState });
  };

  render() {
    if (!this.state.initialized) {
      return <div>LOADING...</div>;
    }

    return (
      <ImsPresentation
        imsActions={this.imsActions}
        imslibData={this.state.imslibData}
      ></ImsPresentation>
    );
  }
}
