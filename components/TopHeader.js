import React from "react";

function TopHeader({ setSettings, setActiveHelp, setActiveHome ,activehome,activehelp,setting}) {
  const handleTabs = (index) => {
    console.log(index);
    {
      index == 1
        ? (setSettings(false), setActiveHelp(false), setActiveHome(true))
        : index == 2
        ? (setSettings(true), setActiveHelp(false), setActiveHome(false))
        : (setSettings(false), setActiveHelp(true), setActiveHome(false));
    }
  };
  return (
    <div className="tabs">
      <div className="left-tabs">
        <div className={`tabs-items  ${activehome ? "active-tab" : ""} `}>
          <div
            className="item-content"
            role="button"
            onClick={() => {
              handleTabs(1);
            }}
          >
            Home
          </div>
          <div className={`  ${activehome ? "border" : ""}`}></div>
        </div>

        <div className={`tabs-items  ${setting ? "active-tab" : ""} `}>
          <div
            className="item-content"
            role="button"
            onClick={() => {
              handleTabs(2);
            }}
          >
            Settings
          </div>
          <div className={`  ${setting ? "border" : ""}`}></div>
        </div>

        <div className={`tabs-items  ${activehelp ? "active-tab" : ""} `}>
          <div
            className="item-content"
            role="button"
            onClick={() => {
              handleTabs(3);
            }}
          >
            Help
          </div>
          <div className={`  ${activehelp ? "border" : ""}`}></div>
        </div>
      </div>

      <div className="right-tabs">
        <div className="tabs-button"><a href="https://easyscanandfullfill.freshdesk.com/support/solutions" target="_blank" style={{textDecoration:"none",color:"white"}}>Contact Us</a></div>
      </div>
    </div>
  );
}

export default TopHeader;
