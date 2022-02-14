import React from "react";

function OrderTopTab({dispatcherName,courier}) {
  return (
    <div>
      <div className="order-header-top Polaris-Card__Header">
        <div>
          {"Dispatcher Name: "} {dispatcherName}
        </div>
        <div>
          {"Courier Company: "} {courier}
        </div>
      </div>
    </div>
  );
}

export default OrderTopTab;
