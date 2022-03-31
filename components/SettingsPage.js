import { Button, Card, Tabs } from "@shopify/polaris";
import React, { useState } from "react";
import { useCallback } from "react";
import { MobileBackArrowMajor } from "@shopify/polaris-icons";
import FormsAddTags from "./FormsAddTags";
import ShippinfCarrier from "./ShippingCarrier";
import AdvanceCheckbox from "./AdvanceCheckbox";
import store from "store-js";
import PartialFormTags from "./PartialFormTags";
import TopHeader from "./TopHeader";

function SettingsPage({
  setActiveHelp,
  setActiveHome,
  activehelp,
  activehome,
  setSettings,
  setting,
}) {
  const [selected, setSelected] = useState(0);

  return (
    <div>
      <TopHeader
        setActiveHelp={setActiveHelp}
        setSettings={setSettings}
        setActiveHome={setActiveHome}
        activehome={activehome}
        activehelp={activehelp}
        setting={setting}
      ></TopHeader>
      <div className="setting-screen-container">
        {/* Here shows the content of page */}
        <div className="setting-screen-content">
          <div className="setting-screen-fullfillment-section">
            <div className="setting-screen-left-tab">
              <div className="setting-screen-left-heading">
                Fulfillment Tags
              </div>
              <div className="setting-screen-left-discription">
                Add your custom order tags that are added at the time of
                fulfillment of the order.
              </div>
            </div>
            <div className="setting-screen-right-tab">
              <Card title="Fullfillment Tags" sectioned>
                <FormsAddTags></FormsAddTags>
              </Card>
              <Card title="Partial Fullfillment Tags" sectioned>
                <PartialFormTags></PartialFormTags>
              </Card>
            </div>
          </div>

          {/* starting new section */}
          <div className="setting-screen-fullfillment-section">
            <div className="setting-screen-left-tab">
              <div className="setting-screen-left-heading">Courier</div>
              <div className="setting-screen-left-discription">
                You can add tracking companies and their tracking URL in this
                section. This information is selected at the beginning of the
                dispatch process which is later assigned to order after
                fulfillment with the tracking number.
              </div>
            </div>
            <div className="setting-screen-right-tab">
              <ShippinfCarrier></ShippinfCarrier>
            </div>
          </div>
          {/* starting new section */}
          <div className="setting-screen-fullfillment-section">
            <div className="setting-screen-left-tab">
              <div className="setting-screen-left-heading">Extra Settings</div>
              <div className="setting-screen-left-discription">
                These settings enable or disable different functionalities of
                the Scan to Fulfill App.
              </div>
            </div>
            <div className="setting-screen-right-tab">
              <Card sectioned>
                <AdvanceCheckbox></AdvanceCheckbox>
              </Card>
            </div>
          </div>
          {/* starting new section */}
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;
