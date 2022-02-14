import { Spinner } from "@shopify/polaris";
import React from "react";

function LoadingSpinner() {
  return (
    <div className="loading">
      <div className="spinner">
        <Spinner accessibilityLabel="Spinner example" size="large"></Spinner>
      </div>
    </div>
  );
}

export default LoadingSpinner;
