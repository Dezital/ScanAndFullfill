import { Card, ResourceList } from "@shopify/polaris";
import React from "react";
import ProductItem from "./ProductItem";

function ProducrList({products}) {
  return (
    <div>
      <Card>
        <ResourceList
          showHeader
          resourceName={{ singular: "Order", plural: "Orders" }}
          items={products}
          renderItem={(product) => {
            return(<div>{product.id}{product.title} </div>
                )
          }}
        />
      </Card>
    </div>
  );
}

export default ProducrList;
