import React, { useEffect, useState } from "react";
import {
  Button,
  Form,
  FormLayout,
  Icon,
  InlineError,
  Link,
  Modal,
  Stack,
  Tag,
  TextField,
} from "@shopify/polaris";
import store from "store-js";
import { DeleteMinor } from "@shopify/polaris-icons";
import { EditMajor } from "@shopify/polaris-icons";
import { useAppBridge } from "@shopify/app-bridge-react";
import { getSessionToken } from "@shopify/app-bridge-utils";
import { useShowError } from "./hooks/useShowError";

function ShippinfCarrier() {
  const [modalOpen, setModalOpen] = useState(false);
  const [trackingCompany, setTrackingCompany] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [loadingData, setLoadingData] = useState(true);
  const [updateModal, setUpdateModal] = useState(false);
  const [updateTrackingName, setUpdateTrackingName] = useState("");
  const [updateTrackingUrl, setUpdateTrackingUrl] = useState("");
  const [indexofUpdate, setIndexOfUpdate] = useState();
  const [pageload, setPageLoad] = useState(0);
  const [isAlreadyExists, setIsAlreadyExists] = useState(false);

  const [carrier, setCarrier] = useState([]);
  const app = useAppBridge();

  useEffect(() => {
    if (loadingData) {
      var iscarrier = store.get("CarrierCompanies");
  
      if (iscarrier) {
        setCarrier(iscarrier);
      }
      setLoadingData(false);
    } else {
      var updatedCarrier = carrier;
      UpdateCarrierValue();
      store.set("CarrierCompanies", updatedCarrier);
    }
  }, [carrier, pageload]);
  useEffect(() => {}, [pageload]);

  const UpdateCarrierValue = async () => {
    const token = await getSessionToken(app);
    const res = await fetch("/updateCarrier", {
      method: "POST",
      body: JSON.stringify({ carrier }),
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-type": "text/plain",
      },
    });
  };

  const handleDelete = (value, index) => {
    const thiscarr = carrier;
    thiscarr.splice(index, 1);
    setCarrier(thiscarr);
    store.set("CarrierCompanies", carrier);
    var toload = pageload;
    toload = toload + 1;
    setPageLoad(toload);
  };

  const handleChangeTrackingCompany = (value) => {
    setTrackingCompany(value);
  };
  const handleChangeTrackingUrl = (value) => {
    setTrackingUrl(value);
  };
  const handleSubmitForm = () => {
    var found = "false";
    carrier.map((value) => {
      if (value.name == trackingCompany) {
      
        found = "true";
      }
    });
    if (found == "true") {
      useShowError("This Company Already Exist");
    } else {
      if (trackingCompany.length <= 0 || trackingUrl.length <= 0) {
        useShowError("Tracking name and url are required");
      } else {
        let newobj = { name: trackingCompany, url: trackingUrl };
        setCarrier((oldcarrier) => [...oldcarrier, newobj]);
        setModalOpen(!modalOpen);
        setTrackingUrl("");
        setTrackingCompany("");
      }
    }
  };
  const toggleActive = () => {
    setModalOpen(!modalOpen);
    setTrackingUrl("");
    setTrackingCompany("");
  };
  const toggleActive2 = () => {
    setUpdateModal(!updateModal);
  };

  return (
    <div>
      <div className="Polaris-Card">
        <div className="Polaris-Card__Header polaris-rows-heading">
          <h2 className="Polaris-Heading">Courier List</h2>
          <div>
            <Button
              onClick={() => {
                setModalOpen(true);
              }}
              primary
            >
              Add New Courier
            </Button>
          </div>
        </div>
        <div className="Polaris-Card__Section">
          <table id="customers">
            <tbody>
              <tr>
                <th>Company</th>
                <th>Tracking URL</th>
                <th>Delete</th>
              </tr>
              <div></div>
              {carrier &&
                carrier.map((value, index) => (
                  <tr>
                    <td>{value.name}</td>
                    <td>{value.url}</td>
                    <td>
                      {/* <div
                        role="button"
                        onClick={() => {
                          handleDelete(value, index);
                        }}
                      >
                        <Icon
                          onClick={() => {}}
                          source={DeleteMinor}
                          color="base"
                        />
                      </div> */}
                      <div className="setting-backbutton" >
                        <Button 
                          
                          style={{color: "#637381"}}
                          icon={DeleteMinor}
                         
                         
                          onClick={() => {
                            handleDelete(value, index);
                          }}
                        ></Button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      {modalOpen && (
        <div style={{ height: "100%" }}>
          <Modal
            medium
            open={modalOpen}
            onClose={toggleActive}
            title="Add Courier Company"
          >
            <Modal.Section>
              <Stack vertical>
                <div>
                  <Form onSubmit={handleSubmitForm}>
                    <FormLayout>
                      <TextField
                        value={trackingCompany}
                        onChange={handleChangeTrackingCompany}
                        label="Company Name"
                        type="text"
                        required
                      />
                      <TextField
                        value={trackingUrl}
                        onChange={handleChangeTrackingUrl}
                        label="Tracking URL"
                        type="text"
                        required
                      />
                      <Button primary submit>
                        Add
                      </Button>
                    </FormLayout>
                  </Form>
                </div>
              </Stack>
            </Modal.Section>
          </Modal>
        </div>
      )}
    </div>
  );
}

export default ShippinfCarrier;
