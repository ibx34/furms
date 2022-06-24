import React from "react";
import PropTypes from "prop-types";
import NumberFormat from "react-number-format";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

export default function FormattedInput({label,number,onChange,disable}: {label: string,number: number,onChange: (number: number) => void,disable:boolean}) {
  return (
    <Box>
      <NumberFormat
        label={label}
        customInput={TextField}
        value={number}
        disabled={disable}
        onChange={(e:any) => onChange(Number(e.target.value))}
      />
    </Box>
  );
}
