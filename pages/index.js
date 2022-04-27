import React, { useCallback, useEffect, useState } from "react";
import useSound from "use-sound";
import {
  Button,
  Card,
  Form,
  FormLayout,
  Frame,
  Heading,
  Icon,
  InlineError,
  Loading,
  Page,
  Select,
  TextField,
} from "@shopify/polaris";

import { useAppBridge } from "@shopify/app-bridge-react";
import { Redirect } from '@shopify/app-bridge/actions';
import { getSessionToken } from "@shopify/app-bridge-utils";
import { toast, ToastContainer } from "react-toastify";
import { SettingsMajor } from "@shopify/polaris-icons";
import { SearchMajor } from "@shopify/polaris-icons";

import LoadingSpinner from "../components/LoadingSpinner";
import SettingsPage from "../components/SettingsPage";
import ProductDetails from "../components/ProductDetails";
import OrderTopTab from "../components/OrderTopTab";
import store from "store-js";
import { useShowError } from "../components/hooks/useShowError";
import HelpPage from "../components/HelpPage";
import TopHeader from "../components/TopHeader";

function index(props) {
  const [orders, SetOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showOrderDetails, SetShowOrderDetails] = useState(false);
  const [orderid, SetOrderId] = useState(undefined);
  const [orderdetails, SetOrderDetails] = useState([]);
  const [orderItems, setOrderItems] = useState([]);
  const [dispatcherName, setDispatcherName] = useState("");
  const [courier, setCourier] = useState("");
  const [error, setError] = useState(false);
  const [errordata, setErrorData] = useState("");
  const [userData, setUserData] = useState(false);
  const [ordernumber, setOrderNumber] = useState(null);
  const [loadingOpen, setLoadingOpen] = useState(false);
  const [setting, setSettings] = useState(false);
  const [selected, setSelected] = useState("");
  const [pageToLoad, setPageToLoad] = useState(false);
  const [options, setOptions] = useState([]);
  const [activehelp, setActiveHelp] = useState(false);
  const [activehome, setActiveHome] = useState(true);
  const app = useAppBridge();
  const redirect = Redirect.create(app)

  useEffect(() => {
  
     getAppSettings();
     getShippingCompanies();
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", (event) => {
      // ...
      if (event.ctrlKey) {
        event.preventDefault();
        return;
      }
    });
  }, []);

  useEffect(() => {
    getShippingCompanies();
  }, [setting]);

  useEffect(() => {}, [pageToLoad]);

  //getting app setting from db like courier Name
  const getAppSettings = async () => {
    try {
      const token = await getSessionToken(app);

      const res = await fetch("/getMyShopSettings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const response2 = await fetch("/billingurl", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const response2data= await response2.json();
      if(response2data.status !='OK'){
       console.log("it should redirect")
       redirect.dispatch(Redirect.Action.REMOTE, response2data.data);
      
      }
      const responseData = await res.json();
      if (responseData.status == "OK") {
        
      
        store.set("partialFullfillment", responseData.data.ParticalTags);
        store.set("CarrierCompanies", responseData.data.carrier);
        store.set("fullfilmentTags", responseData.data.FullfillTags);
        getShippingCompanies();
        setPageToLoad(!pageToLoad);
      }
    } catch (error) {
      // useShowError("An Error has accoured in fetching data");
    }
  };

  //Adding options that display on index page
  const getShippingCompanies = () => {
    if (options.length > 0) {
      while (options.length) {
        options.pop();
      }
    }
    options.push({ label: "Select Courier Company", value: "" });

    var companies = store.get("CarrierCompanies");

    if (companies) {
      companies.map((item, index) => {
        options.push({ label: item.name, value: item.name });
      });
    }

    refreshpage = refreshpage + 1;
    setPageToLoad(!pageToLoad);
  };

  //handle the change of page
 

  var refreshpage = 0;
  var id;
 

  const playSuccessSound = () => {
    const audio = new Audio(
      "https://drive.google.com/uc?export=download&id=1M95VOpto1cQ4FQHzNBaLf0WFQglrtWi7"
    );
    audio.play();
  };

  const playErrorSound = (message) => {
    const audio = new Audio(
      "https://drive.google.com/uc?export=download&id=1JPxPaJjI2ktgV_50364NbzFTgwwTWOpg"
    );
    audio.play();
    useShowError(message);
  };

  const handleSelectChange = useCallback(
    (value, label) => (console.log(label), setCourier(value)),
    []
  );

  const handleSettings = () => {
    setSettings(true);
  };

  const handleChangeDispatcher = (value) => {
    setDispatcherName(value);
  };

  const handleChangeCourier = (value) => {
    setCourier(value);
  };

  //submit dispatcher form
  const handleSubmitForm = (e) => {
    if (dispatcherName.length <= 0) {
      setError(true);
      setErrorData("Dispater Name is required");
    } else if (courier.length <= 0) {
      setError(true);
      setErrorData("Courier Name is required");
    } else {
      setError(false);
      setUserData(true);
      store.set("selectedCourier", courier);
      store.set("selectedDispatcher", dispatcherName);
      var ourcompanies = store.get("CarrierCompanies");
      ourcompanies.map((val) => {
        if (val.name == courier) {
          store.set("selectedUrl", val.url);
        }
      });
    }
  };

  const handleChangeOrder = (value) => {
    setOrderNumber(value);
  };
  //submit order id to get orders details
  const handleOrderidSubmit = async (e) => {
    setLoading(true);
    const token = await getSessionToken(app);
    const res = await fetch("/ordersNumber", {
      method: "POST",
      body: JSON.stringify({ ordernumber }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-type": "text/plain",
      },
    });
    const responseData = await res.json();
    if (responseData.status == "OK") {
      SetOrderDetails(responseData.data);
      if (responseData.data.fulfillment_status == "fulfilled") {
        playErrorSound("This Order is already Fullfilled");

        setLoading(false);
      } else {
        setOrderItems(responseData.data.line_items);
        SetShowOrderDetails(true);
        setUserData(false);
      }
    } else {
      playErrorSound("Invalid order Number");
    }

    setLoading(false);
    setOrderNumber("");

    // var orderdetails;
    // orders.map((val, index) => {
    //   if (val.order_number == ordernumber) {
    //     id = val.id;
    //     orderdetails = val;
    //   }
    // });
    // if (ordernumber !== null) {
    //   const handleClick = async (item) => {
    //     if (orderdetails.fulfillment_status == "fulfilled") {
    //       playErrorSound("This Order is already Fullfilled");
    //     } else {
    //       setLoading(true);
    //       const token = await getSessionToken(app);
    //       const res = await fetch(`/ordersdetails?id=${id}`, {
    //         headers: { Authorization: `Bearer ${token}` },
    //       });
    //       const responseData = await res.json();
    //       if (responseData.status == "OK") {
    //         SetOrderDetails(responseData.data);
    //         if (responseData.data.fulfillment_status == "fulfilled") {
    //           playErrorSound("This Order is already Fullfilled");

    //           setLoading(false);
    //         } else {
    //           setOrderItems(responseData.data.line_items);
    //           SetShowOrderDetails(true);
    //           setUserData(false);
    //         }
    //       } else {
    //         alert("error in fetching data");
    //       }

    //       setLoading(false);
    //     }
    //   };
    //   if (id) {
    //     handleClick(orderid);
    //   } else {
    //     playErrorSound("No Order Found against this number");
    //   }
    // } else {
    //   // alert("No Order Found against this number ");
    //   playErrorSound("No Order Found against this number");
    // }
    // setOrderNumber("");
  };


  //loading screen for index page
  if (loading) {
    return (
      <Page>
        <div style={{ height: "100px" }}>
          <Frame>
            <Loading />
          </Frame>
        </div>
      </Page>
    );
  }

  //setting screen
  if (setting) {
    return <SettingsPage setActiveHelp={setActiveHelp} setSettings={setSettings} setActiveHome={setActiveHome}  activehome={activehome} activehelp={activehelp} setting={setting}></SettingsPage>;
  }
  // order details screen like where main loading shows
  if (showOrderDetails) {
    return (
      <div className="orderdetails-container">
        {loadingOpen && <LoadingSpinner></LoadingSpinner>}
        <div className="button-div">
          <Button
            onClick={() => {
              SetShowOrderDetails(false);
              setUserData(true);
            }}
          >
            Back
          </Button>
        </div>

        <div className="product details div">
          <ProductDetails
            orderdetails={orderdetails}
            orderItems={orderItems}
            setOrderItems={setOrderItems}
            setLoadingOpen={setLoadingOpen}
            setUserData={setUserData}
            SetShowOrderDetails={SetShowOrderDetails}
            dispatcherName={dispatcherName}
            courier={courier}
          ></ProductDetails>
        </div>

        <ToastContainer></ToastContainer>
      </div>
    );
  }
  //settings for users 
  if(activehelp){
    return <HelpPage setActiveHelp={setActiveHelp} setSettings={setSettings} setActiveHome={setActiveHome}  activehome={activehome} activehelp={activehelp} setting={setting}></HelpPage>
  }
  // screen to scan order number
  if (userData) {
    return (
      <div>
        <div>
          <Page>
            <OrderTopTab dispatcherName={dispatcherName} courier={courier} />
          </Page>
        </div>
        <div className="orderscreen-instruction">
          <div className="orderscreen-heading">SCAN ORDER</div>
          <div className="orderscreen-discription">
            Scan order barcode on your invoice
          </div>
          <div className="orderscreen-discription">
            OR enter order number below and hit return.
          </div>
        </div>
        <Page>
          <div>
            <Card sectioned>
              <div>
                <Form onSubmit={handleOrderidSubmit}>
                  <FormLayout>
                    {error && (
                      <InlineError
                        message={errordata}
                        fieldID="n"
                      ></InlineError>
                    )}
                    <TextField
                      value={ordernumber}
                      onChange={handleChangeOrder}
                      label="Order Number"
                      type="text"
                      required
                      autoFocus={true}
                      prefix={<Icon source={SearchMajor} color="base" />}
                    />
                    <Button primary submit>
                      Submit
                    </Button>
                  </FormLayout>
                </Form>
              </div>
            </Card>
          </div>
          <ToastContainer></ToastContainer>
        </Page>
        <ToastContainer></ToastContainer>
      </div>
    );
  }

  //main screen to fetch tracking number and details
  return (
    <div>
      <TopHeader setActiveHelp={setActiveHelp} setSettings={setSettings} setActiveHome={setActiveHome} activehome={activehome} activehelp={activehelp} setting={setting}></TopHeader>
      <div className="pageclass">
        <Card title="Provide Required Information to Begin" sectioned>
          <Form onSubmit={handleSubmitForm}>
            <FormLayout>
              {error && (
                <InlineError message={errordata} fieldID="n"></InlineError>
              )}
              <TextField
                value={dispatcherName}
                onChange={handleChangeDispatcher}
                label="Dispatcher Name"
                type="text"
                required
                autoComplete="dispatcher"
                helpText={
                  <span>
                    We will use this information in order tags section.
                  </span>
                }
              />
              <Select
                label="Courier Company"
                options={options}
                onChange={handleSelectChange}
                value={courier}
                helpText={
                  <span>
                    Select below to assign Courier and Tracking URL for
                    fulfilled orders.
                  </span>
                }
              />
              <Button primary submit>
                Submit
              </Button>
            </FormLayout>
          </Form>
        </Card>
      </div>
      <ToastContainer></ToastContainer>
    </div>
  );
}

export default index;
