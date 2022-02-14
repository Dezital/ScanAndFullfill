import {
  Button,
  Checkbox,
  Form,
  FormLayout,
  InlineError,
  Stack,
  Tag,
  TextField,
} from "@shopify/polaris";
import React, { useCallback, useState } from "react";

function AdvanceCheckbox() {
  const [checked, setChecked] = useState(false);
  const [playSound, setPlaySound] = useState(true);
  const [addTags, setAddTags] = useState(true);
  const [allowPartialOrders, setallowPartialOrders] = useState(true);

  const handleChangeFulfilTags = useCallback(
    (newChecked) => setAddTags(newChecked),
    []
  );
  const handleChangePlaySound = useCallback(
    (newChecked) => setPlaySound(newChecked),
    []
  );
  const handleChangePartialOrders = useCallback(
    (newChecked) => setallowPartialOrders(newChecked),
    []
  );

  return (
    <div>
      <div>
        <Checkbox
          label="Add Tags When Order Fullfilled"
          checked={addTags}
          onChange={handleChangeFulfilTags}
        />
      </div>
      <div>
        <Checkbox
          label="Allow Partial Orders "
          checked={allowPartialOrders}
          onChange={handleChangePartialOrders}
        />
      </div>
      <div>
        <Checkbox
          label="Play Sound"
          checked={playSound}
          onChange={handleChangePlaySound}
        />
      </div>
    </div>
  );
}

export default AdvanceCheckbox;
