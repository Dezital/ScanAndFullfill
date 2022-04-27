import React, { useState, useEffect } from "react";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";
import {
  Badge,
  Button,
  Card,
  Form,
  FormLayout,
  Icon,
  Image,
  InlineError,
  Modal,
  Page,
  Stack,
  Tag,
  TextField,
} from "@shopify/polaris";
import { toast, ToastContainer } from "react-toastify";
import { IncomingMajor, CircleTickMajor } from "@shopify/polaris-icons";
import LoadingSpinner from "./LoadingSpinner";
import store from "store-js";
import { useShowSuccess } from "./hooks/useShowSuccess";
import { useShowError } from "./hooks/useShowError";

function ProductDetails({
  orderdetails,
  setOrderItems,
  orderItems,
  setLoadingOpen,
  setUserData,
  SetShowOrderDetails,
  dispatcherName,
  courier,
}) {
  const [callstate, setCallState] = useState(true);
  const [value, Setvalue] = useState(0);
  const [countScan, setCountScan] = useState(0);
  const [error, setError] = useState(false);
  const [sku, setSku] = useState("");
  const [totalWeight, setTotalWeight] = useState();
  const [totalProductQuantity, setTotalProductQuantity] = useState(0);
  const [trackinNumber, setTrackingNumber] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [loadedItems, setLoadeditems] = useState(false);
  const [orderNumber, setOrderNumber] = useState();
  const [trackingURl, setTrackingUrl] = useState();
  const [trackingCompany, setTrackingCompany] = useState();
  const [previousTags, setPreviousTags] = useState([]);
  const [highlight, setHighLight] = useState();
  const [initalOrdertags, setOrderTags] = useState([]);
  const [partial, setPartial] = useState(false);

  const [tags, setTags] = useState([]);

  const app = useAppBridge();

  useEffect(() => {
    if (callstate === true) {
      handleItems();
      setCallState(false);
    }
  }, [value]);

  const playSuccessSound = () => {
    const audio = new Audio(
      "https://drive.google.com/uc?export=download&id=1M95VOpto1cQ4FQHzNBaLf0WFQglrtWi7"
    );
    audio.play();
  };
  const playErrorSound = () => {
    const audio = new Audio(
      "https://drive.google.com/uc?export=download&id=1JPxPaJjI2ktgV_50364NbzFTgwwTWOpg"
    );
    audio.play();
  };

  const tagMarkup = previousTags.map((option) => (
    <Tag key={option}>{option}</Tag>
  ));

  const handleItems = () => {
    var ispartialorder;
   
    if (orderdetails.fulfillment_status == "partial") {
      setPartial(true);
      ispartialorder = 1;
    }

    var track = store.get("selectedUrl");
    var trackComp = store.get("selectedCourier");
    setTrackingCompany(trackComp);

    setTrackingUrl(track);

    var storetags = store.get("fullfilmentTags");
    storetags.map((value) => {
      setTags((tags) => [...tags, value]);
    });
    const newtags = [dispatcherName, courier];
    newtags.map((value) => {
      setTags((tags) => [...tags, value]);
    });
 

    setOrderNumber(orderdetails.order_number);
    // For assignment of total weight
    var wiegt_in_kg = orderdetails.total_weight / 1000;
    setTotalWeight(wiegt_in_kg);
    //fetching tags already that are on a order
     let ordertags = orderdetails.tags;

     var productArray = ordertags.split(",");
    if (productArray.length > 0) {
      setPreviousTags(productArray);
    }

    //adding that tags into array of tag so that these would make no issue
    productArray.map((value) => {
      setTags((tags) => [...tags, value]);
    });

    // adding a new line as scanned in object of products
    const line_items = orderItems;
    //adding quantity
    var quantity = 0;

    line_items.forEach((element) => {
      if (ispartialorder == 1) {
        quantity = quantity + element["fulfillable_quantity"];
        var orderquantity =element["quantity"]
        var fullfilled=  element["fulfillable_quantity"];
        var fulliedquantity=orderquantity-fullfilled;
        
      
        element["fullfiled_quantity"]=fulliedquantity
      } else {
        quantity = quantity + element["quantity"];
        
      }
      element["scanned"] = 0;
    });

    var itemvalue = value;
    // fetching the product data
    line_items.forEach(async (element) => {
  
      var product_id = element["product_id"];
      var variant_id = element["variant_id"];
  
      const token = await getSessionToken(app);
      const res = await fetch("/getImage", {
        method: "POST",
        body: JSON.stringify({ product_id, variant_id }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "text/plain",
        },
      });
      const responseData = await res.json();
      if (responseData.status == "OK") {
        element["imgUrl"] = responseData.data;
        element["barcode"] = responseData.barcode;
        itemvalue = itemvalue + 1;
        Setvalue(itemvalue);
      }
    });

    setTotalProductQuantity(quantity);
    setOrderItems(line_items);
    setLoadeditems(true);
  };

  const HandleOrderSubmit = async () => {
    try {
      const token = await getSessionToken(app);
      const res = await fetch("/updateorder", {
        method: "POST",
        body: JSON.stringify({
          trackinNumber,
          tags,
          orderdetails,
          orderItems,
          trackingURl,
          trackingCompany,
        }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "text/plain",
        },
      });
      const responseData = await res.json();
      if (responseData.status == "OK") {
        playSuccessSound();
        useShowSuccess("Your order fullfilled successfully");
      } else {
        playErrorSound();
        useShowError("An Error has occured in fullfillment");
      }

      setModalOpen(false);
      setLoadingOpen(false);
      SetShowOrderDetails(false);
      setUserData(true);
      SetShowOrderDetails(false);
      setUserData(true);
    } catch (error) {
      playErrorSound();
      useShowError("An Error has occured in fullfillment");
    
      setModalOpen(false);
      setLoadingOpen(false);
      SetShowOrderDetails(false);
      setUserData(true);
      SetShowOrderDetails(false);
      setUserData(true);
    }
  };

  const handleSubmitTracking = (item) => {
    setLoadingOpen(true);
    if (totalProductQuantity == countScan) {
      HandleOrderSubmit();
    } else {
      handlePartialSubmission();
    }
  };
  const handleChangeTracking = (value) => {
    setTrackingNumber(value);
  };

  const handleChangeSku = (value) => {
    setSku(value);
  };

  const handleSubmitSku = () => {
    var scanitems;
    var items = orderItems;

    orderItems.map((item, index) => {
      if (item.sku === sku || item.barcode === sku) {
        setHighLight(index);
      }
    });
    let finditem = orderItems.find(
      (orderitem) => orderitem.sku === sku || orderitem.barcode === sku
    );
    if (finditem) {
      if (finditem.quantity > finditem.scanned) {
        finditem["scanned"] = finditem.scanned + 1;
        Setvalue(value + 1);
        scanitems = countScan;
        scanitems++;
        setCountScan(scanitems);
        setOrderItems(items);
        playSuccessSound();
        useShowSuccess("Item scanned");

        if (scanitems == totalProductQuantity) {
          playSuccessSound();
          useShowSuccess("Your order is scanned completely");

          setModalOpen(true);
        }
      } else {
        playErrorSound();
        useShowError("Required quantity already scanned");
      }
    } else {
      playErrorSound();
      useShowError("Invalid SKU/Barcode");
    }
    setSku("");
  };

  const handleTrackingModal = () => {
    setModalOpen(true);
  };

  const handlePartialSubmission = async () => {
   
    try {
      const token = await getSessionToken(app);
      const res = await fetch("/particalFulFilment", {
        method: "POST",
        body: JSON.stringify({
          trackinNumber,
          tags,
          orderdetails,
          orderItems,
          trackingURl,
          trackingCompany,
        }),
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-type": "text/plain",
        },
      });
      const responseData = await res.json();
      if (responseData.status == "OK") {
        playSuccessSound();
        useShowSuccess("Your order fullfilled successfully");
      } else {
        playErrorSound();
        useShowError("An Error has occured in fullfillment");
      }

      setModalOpen(false);
      setLoadingOpen(false);
      SetShowOrderDetails(false);
      setUserData(true);
      SetShowOrderDetails(false);
      setUserData(true);
    } catch (error) {
      playErrorSound();
      useShowError("An Error has occured in fullfillment");
      setModalOpen(false);
      setLoadingOpen(false);
      SetShowOrderDetails(false);
      setUserData(true);
      SetShowOrderDetails(false);
      setUserData(true);
    }
  };

  return (
    <div className="order-detail-main">
      <div className="search-top-div">
        <div className="orderscreen-header ">
          <Card sectioned>
            <div>
              <Form onSubmit={handleSubmitSku}>
                <FormLayout>
                  <TextField
                    value={sku}
                    onChange={handleChangeSku}
                    label="SKU / Barcode"
                    type="text"
                    required
                    autoFocus={true}
                    helpText={
                      <span>Scan product SKU or Barcode in this order.</span>
                    }
                  />
                  <Button primary submit>
                    Submit
                  </Button>
                </FormLayout>
              </Form>
            </div>
          </Card>

          <div className="Polaris-Card productfill-card">
            <div>
              <div className="list-title">Packing Items</div>
              {loadedItems == true &&
                orderItems.map((value, index) => (
                  <div key={index}>
                    <div
                      className={`product-fullfillment-card ${
                        highlight == index ? "scanned-div" : ""
                      }`}
                    >
                      <div className="product-fullfillment-card-img">
                        <div className="product-image-section">
                          {highlight == index ? (
                            <Icon source={IncomingMajor} color="primary" />
                          ) : (
                            <Icon source={IncomingMajor} color="base" />
                          )}
                          {/* <Icon source={IncomingMajor} color="primary" /> */}
                          <img className="product-img" src={value.imgUrl} />
                        </div>
                      </div>

                      <div className="product-fullfillment-card-details ">
                        <div className="title-text">{value.name}</div>

                        {value.sku == "" ? (
                          <div>
                            <div className="orderid-text">
                              SKU:No SKU Added to Product add to scan
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="orderid-text">
                              {" "}
                              <b>SKU:</b> {value.sku}
                            </div>
                          </div>
                        )}
                        {value.barcode === null ? (
                          <div>
                            <div className="orderid-text">
                              This product has no Barcode
                            </div>
                          </div>
                        ) : (
                          <div>
                            <div className="orderid-text">
                              <b>Barcode:</b> {value.barcode}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="product-fullfillment-card-quantity">
                        <div className="quantity-text ">
                          Scanned: {value.scanned}
                        </div>
                        <div className="quantity-text">
                          Quantity: {value.quantity}
                        </div>
                        {partial && (
                          <div className="quantity-text ">
                            Fulfilled: {value.fullfiled_quantity}
                          </div>
                          
                        )}
                        {partial && (
                          <div className="quantity-text ">
                            Pending: {value.fulfillable_quantity}
                          </div>
                          
                        )}
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="results-container">
          <Card sectioned title="Tracking Information" >
            <div className="title">
              {" "}
              <b style={{ fontWeight: 600 }}>Dispatched By: </b>
              {dispatcherName}
            </div>
            <div className="bottom">
              <b style={{ fontWeight: 600 }}>Carrier:</b> {courier}
            </div>
          </Card>
          <Card sectioned title="Results">
            <div className="title">Total Items: {totalProductQuantity}</div>
            <div>Scanned Items: {countScan}</div>
            <div className="fulfill bottom-button">
              <Button
                primary
                onClick={() => {
                  if (countScan > 0) {
                    handleTrackingModal();
                  } else {
                    alert("Please scan atleat one item");
                  }
                }}
              >
                Partial Fullfillment
              </Button>
            </div>
          </Card>

          <Card title="Order Information">
            <div className="order-status">
              <div className="order-status-number">Order#{orderNumber}</div>
              <div className="order-status-badge">
                {partial == true ? (
                  <Badge progress="partiallyComplete" status="warning">
                    Partially fulfilled
                  </Badge>
                ) : (
                  <Badge progress="incomplete" status="warning">
                    Unfulfilled
                  </Badge>
                )}
              </div>
            </div>
            <Card.Section title="Customer">
              {orderdetails.shipping_address && (
                <p>{orderdetails.shipping_address.name}</p>
              )}
              {!orderdetails.customer && <p>No Information Provided</p>}
            </Card.Section>

            <Card.Section title="Contact">
              {orderdetails.customer && (
                <div>
                  {orderdetails.customer.email ? (
                    <p>{orderdetails.customer.email}</p>
                  ) : (
                    <p>No Email provided</p>
                  )}
                  {orderdetails.customer.phone != null ? (
                    <p>{orderdetails.customer.phone}</p>
                  ) : (
                    <p>No Phone Number</p>
                  )}
                </div>
              )}
              {!orderdetails.customer && <p>No Information Provided</p>}
            </Card.Section>
            <Card.Section title="Shipping">
              {orderdetails.customer && (
                <div>
                  {orderdetails ? (
                    <div>
                      <p>{orderdetails.customer.default_address.name}</p>
                      <p>{orderdetails.customer.default_address.city}</p>
                      <p>{orderdetails.customer.default_address.country}</p>
                      <p>{orderdetails.customer.default_address.address1}</p>
                    </div>
                  ) : (
                    <p>No Address provided</p>
                  )}
                </div>
              )}
              {!orderdetails.customer && <p>No Information Provided</p>}
            </Card.Section>

            <Card.Section title="Weight">
              <p>{totalWeight} kg</p>
            </Card.Section>
            <Card.Section title="Tags">
              {/* {!length && <p>No tags</p>} */}
              <Stack spacing="tight">{tagMarkup}</Stack>
            </Card.Section>
          </Card>
        </div>
      </div>

      {modalOpen && (
        <div style={{ height: "100%" }}>
          <Modal
            medium
            open={modalOpen}
            //  onClose={toggleActive}
            title="Add Tracking Number To Fulfill Order"
          >
            <Modal.Section>
              <Stack vertical>
                <div>
                  <Form onSubmit={handleSubmitTracking}>
                    <FormLayout>
                      <TextField
                        value={trackinNumber}
                        onChange={handleChangeTracking}
                        label="Tracking"
                        type="text"
                        required
                        autoFocus={true}
                      />
                      <Button primary submit>
                        Fulfill
                      </Button>
                    </FormLayout>
                  </Form>
                </div>
              </Stack>
            </Modal.Section>
          </Modal>
        </div>
      )}

      <ToastContainer />
    </div>
  );
}

export default ProductDetails;
