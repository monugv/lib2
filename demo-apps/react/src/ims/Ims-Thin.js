import React from "react";
import ImsWebHelper from "./ims-web-helper/ImsWebHelper";

import ImsThinPresentation from "./Ims-Thin-Presentation";

import "./ims.css";

import { ImsActions } from "./actions/ims-actions";
import { ImsData } from "./data/ims-data";

export default class ImsThin extends React.Component {
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

    ImsWebHelper.injectAdobeImsThin().then(() => {
      this.adobeIMS = window["adobeIMS"];
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
      <ImsThinPresentation
        imsActions={this.imsActions}
        imslibData={this.state.imslibData}
      ></ImsThinPresentation>
    );
  }
}
