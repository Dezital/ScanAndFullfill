import React, { useState } from "react";
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
import { useShowSuccess } from "./hooks/useShowSuccess";

function ContactUsForm() {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState(false);
  const [errordata, setErrorData] = useState("");

  const handleChangeName = (value) => {
    setName(value);
  };
  const handleChangeEmail = (value) => {
    setEmail(value);
  };
  const handleChangeMessage = (value) => {
    setMessage(value);
  };

  const handleFormSubmit = async () => {
    setError(false);
    setErrorData("");
    console.log(name.length);
    if (message.length < 3) {
      setError(true);
      setErrorData("Enter Your message");
    }

    if (
      !email.match(
        /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
      )
    ) {
      setError(true);
      alert("true");

      setErrorData("Email Address is Invalid");
    }
    if (name.length < 3) {
      setError(true);
      setErrorData("Name is invalid");
      console.log("not valid");
    }

    if (!error) {
      console.log("email send ");
      const res = await fetch("/sendMail", {
        method: "POST",
        body: JSON.stringify({ name, email, message }),
        headers: {
          "Content-type": "text/plain",
        },
      });

      useShowSuccess("Your message has been sent successfully");
      setName("");
      setEmail("");
      setMessage("");
    }
  };

  return (
    <div>
      <Form onSubmit={handleFormSubmit}>
        <FormLayout>
          {error && <InlineError message={errordata} fieldID="n"></InlineError>}
          <TextField
            value={name}
            onChange={handleChangeName}
            label="Your Name"
            type="text"
            required
          />
          <TextField
            value={email}
            onChange={handleChangeEmail}
            label="Your Email"
            type="email"
            required
          />
          <TextField
            value={message}
            onChange={handleChangeMessage}
            label="How we can help you?"
            type="text"
            required
            multiline="true"
          />

          <Button primary submit>
            Submit
          </Button>
        </FormLayout>
      </Form>
    </div>
  );
}

export default ContactUsForm;
