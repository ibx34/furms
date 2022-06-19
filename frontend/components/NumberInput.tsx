import React from "react";
import PropTypes from "prop-types";
import NumberFormat from "react-number-format";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

export default function FormattedInput({label,number,onChange}: {label: string,number: number,onChange: (number: number) => void}) {
  return (
    <Box>
      <NumberFormat 
        customInput={TextField}
        value={number}
        onChange={(e:any) => onChange(Number(e.target.value))}
      />
    </Box>
  );
}
