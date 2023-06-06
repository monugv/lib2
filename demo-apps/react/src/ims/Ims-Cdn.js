import React from "react";

import ImsWebHelper from "./ims-web-helper/ImsWebHelper";

import ImsPresentation from "./Ims-Presentation";

import "./ims.css";

import { ImsActions } from "./actions/ims-actions";
import { ImsData } from "./data/ims-data";

export default class ImsCdn extends React.Component {
  imsActions = null;
  imsEvents = null;
  constructor() {
    super();

    const imsData = new ImsData(this.onStateChanged);

    window.adobeid = imsData.adobeIdData;

    this.state = {
      initialized: false,
      imslibData: imsData.imslibData,
    };

    ImsWebHelper.injectAdobeIms().then(() => {
      this.adobeIMS = window.adobeIMS;
      this.imsActions = new ImsActions(this.adobeIMS, imsData);

      this.setState({ initialized: true });
    });
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
