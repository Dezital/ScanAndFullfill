import {
    Button,
    Form,
    FormLayout,
    InlineError,
    Stack,
    Tag,
    TextField,
  } from "@shopify/polaris";
  import React, { useCallback, useEffect, useState } from "react";
  import { useAppBridge } from "@shopify/app-bridge-react";
  import { getSessionToken } from "@shopify/app-bridge-utils";
  import store from "store-js";
  
  
  function PartialFormTags() {
    const [tagValue, setTagValue] = useState("");
    const [selectedTags, setSelectedTags] = useState([]);
    const [loadData, setLoadData] = useState(true);
    const app = useAppBridge();
    useEffect(() => {
    
      if (loadData) {
        var storetags = store.get("partialFullfillment");
        if (storetags) {
          setSelectedTags(storetags);
        }
        setLoadData(false);
      } else {
        var tagsupdate = selectedTags;

        UpdateTags()
        store.set("partialFullfillment", tagsupdate);
      
      }
     
    }, [selectedTags]);
  
    const UpdateTags=async()=>{
      var tagsupdate = selectedTags;
      const token = await getSessionToken(app);
        const res = await fetch("/updatePartialTags", {
          method: "POST",
          body: JSON.stringify({ tagsupdate}),
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-type": "text/plain",
          },
        });
    }
  
    const handleRemoveTag = useCallback(
      (tag) => () => {
        setSelectedTags((previousTags) =>
          previousTags.filter((previousTag) => previousTag !== tag)
        );
      },
      []
    );
    const tagMarkup = selectedTags.map((option) => (
      <Tag onRemove={handleRemoveTag(option)} key={option}>
        {option}
      </Tag>
    ));
    const handleSubmitTag = (e) => {
      setSelectedTags((previousTags) => [...previousTags, tagValue]);
      setTagValue("");
    };
  
    const handleChangeTag = (value) => {
      setTagValue(value);
    };
  
    return (
      <div>
        <div className="Form-tags">
          <Form onSubmit={handleSubmitTag}>
            <FormLayout>
              <TextField
                value={tagValue}
                onChange={handleChangeTag}
                label="Add Tags"
                type="text"
                required
              />
            </FormLayout>
          </Form>
        </div>
        <Stack spacing="tight">{tagMarkup}</Stack>
      </div>
    );
  }
  
  export default PartialFormTags;
  