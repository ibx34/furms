import React from "react";
import PropTypes from "prop-types";
import NumberFormat from "react-number-format";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";

const NumberFormatCustom = React.forwardRef(function NumberFormatCustom(
  props,
  ref
) {
  const { onChange, ...other } = props;

  return (
    <NumberFormat
      {...other}
      getInputRef={ref}
      onValueChange={(values) => {
        onChange({
          target: {
            name: props.name,
            value: values.value
          }
        });
      }}
      // isNumericString
    />
  );
});

NumberFormatCustom.propTypes = {
    name: PropTypes.string.isRequired,
    onChange: PropTypes.func.isRequired
};

export default function FormattedInput({label,number,onChange}: {label: string,number: number,onChange: (number: number) => void}) {
  //const [numberformat, setNumberformat] = React.useState<number>();

  return (
    <Box>
      <TextField
        label={label}
        value={number}
        onChange={(e) => onChange(Number(e.target.value))}
        variant="outlined"
        InputProps={{
            inputComponent: NumberFormatCustom
        }}
      />
    </Box>
  );
}
