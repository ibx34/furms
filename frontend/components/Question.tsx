import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import { Divider, IconButton, Paper, Typography } from '@mui/material';
import { DialogContentText, Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FormattedInput from './NumberInput';

const Question = ({
    question,
    updateResponse,
    deleteResponseKey,
    disable,
    startingValue
}: {
    question: {
        name: string,
        form_id: number,
        id: number,
        type: number,
        description: string,
        min: number | null,
        max: number | null
    },
    updateResponse: (question: number, input: string | boolean | number) => void,
    deleteResponseKey: (question: number) => void,
    disable: boolean,
    startingValue: string | boolean | number | undefined
}) => {
    const [value, setValue] = useState<string | boolean | number | undefined>(startingValue);
    const [error, setError] = useState<boolean>();

    const updateValue = (value: string | boolean | number) => {
        setError(false);
        setValue(value);
        if (typeof value == "string" && value.toString().length <= 0) {
            setError(false);
            return deleteResponseKey(question.id);
        }
        switch (question.type) {
            case 0: 
                if (question.max && typeof value == "string" && value.length > question.max) {
                    setError(true);
                    return;
                }

                if (question.min && typeof value == "string" && value.length < question.min) {
                    setError(true);
                    return;
                }
        }
        updateResponse(question.id, value);
    }

    const decideError = () => {
        if (error && value) {
            if (typeof value == "string") {
                if (question.max && value.length > question.max) {
                    return `Too long. ${value.length}/${question.max} characters`;
                }
    
                if (question.min && value.length < question.min) {
                    return `Too short. ${value.length}/${question.min} characters`;
                }
            }
        }
        return null
    }

    const typeOfValue = () => {
        switch (typeof value) {
            case "string":
                return 0;
            case "number":
                return 1;
        }
    }

    const renderInput = () => {
        switch (question.type) {
            case 0:
                return (
                    <TextField 
                        variant="outlined"
                        label="Text"
                        value={value}
                        onChange={(e) => updateValue(e.target.value)}
                        disabled={disable}
                        error={error}
                        helperText={decideError()}
                    />
                )
            case 1:
                if (typeof value == "number") {
                    return (<FormattedInput
                        label={"Number"}
                        number={value}
                        onChange={(e) => updateValue(e)}
                        // disabled={disable}
                        // error={error}                    
                    />)
                }
        }
        return (<>Error...</>)
    }

    return (
        <Paper variant="outlined" elevation={8}>
            <Stack spacing={2} padding={2}>
                <div>
                    <Typography variant="h5" component="div">
                        {question.name}
                    </Typography>
                    <Typography variant="body1" component="div">
                        {question.description}
                    </Typography>
                </div>
                <Divider />              
                <div>
                    {renderInput()}
                </div>
            </Stack>
        </Paper>
    );
};
export default Question;
