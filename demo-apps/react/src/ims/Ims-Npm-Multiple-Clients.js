import React from "react";

import "./ims.css";
import ImsNpm from "./Ims-Npm";

export default class ImsNpmMultipleClients extends React.Component {
  imsActions = null;
  imsEvents = null;

  client0 = {
    client_id: "IMSLibJSTestClient",
    locale: "en_US",
    scope: "AdobeID,openid",
    environment: "stage",
    key: "adobeIMS",
    logsEnabled: true,
  };
  client1 = {
    client_id: "IMSLibJSTestClient1",
    locale: "en_US",
    scope: "AdobeID,openid",
    environment: "stage",
    key: "client1",
    logsEnabled: true,
  };

  render() {
    return (
      <div className="row">
        <ImsNpm adobeid={this.client0} />
        <ImsNpm adobeid={this.client1} />
      </div>
    );
  }
}
