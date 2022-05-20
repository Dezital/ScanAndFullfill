import React, { useState } from "react";
import { Button, Card, Tabs } from "@shopify/polaris";

import TopHeader from "./TopHeader";
import ContactUsForm from "./ContactUsForm";

function HelpPage({
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
              <div className="setting-screen-left-heading">Get In Touch</div>
              <div className="setting-screen-left-discription">
                We would happy to help with any query you have, simply complete
                this form
              </div>
            </div>
            <div className="setting-screen-right-tab">
              <Card sectioned>
                <ContactUsForm></ContactUsForm>
              </Card>
            </div>
          </div>

          {/* starting new section */}
        </div>

        <div className="setting-screen-content">
          <div className="setting-screen-fullfillment-section">
            <div className="setting-screen-left-tab ">
              <div className="setting-screen-left-heading">Knowledge Based</div>
              <div className="setting-screen-left-discription"></div>
            </div>
            <div className="setting-screen-right-tab">
              <Card sectioned>
                Browse our extensive Knowledge based for guides,popular Use
                cases, tips and tricks.{" "}
                <a
                  href="https://easyscanandfullfill.freshdesk.com/support/solutions"
                  target="_blank"
                >
                  Visit the knowledge base
                </a>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HelpPage;
