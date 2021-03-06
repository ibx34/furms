import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import { Checkbox, Divider, FormGroup, IconButton, Paper, Typography } from '@mui/material';
import { DialogContentText, Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FormattedInput from './NumberInput';
import { QuestionType } from '../types/types';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import { red } from '@mui/material/colors';

const Question = ({
    question,
    updateResponse,
    deleteResponseKey,
    disable,
    startingValue
}: {
    question: QuestionType,
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
            case 4:
                return (
                    <TextField 
                        variant="standard"
                        value={value}
                        onChange={(e) => updateValue(e.target.value)}
                        disabled={disable}
                        error={error}
                        helperText={decideError()}
                        fullWidth={question.type == 4}
                    />
                )
            case 1:
                if (typeof value == "number") {
                    return (<FormattedInput
                        number={value}
                        onChange={(e) => updateValue(e)}
                        disable={disable} 
                        label={null}                        
                        // error={error}                    
                    />)
                }
            case 2:
                if (typeof value == "string" && question.choices && question.choices.choices) {
                    return (
                        <FormControl>
                            <RadioGroup
                                defaultValue={value}
                                onChange={(e) => updateValue(e.target.value)}
                            >
                                {question.choices.choices.map((c:string,_idx:number) => (
                                    <FormControlLabel key={_idx} disabled={disable} value={_idx} control={<Radio />} label={c} />
                                ))}
                            </RadioGroup>
                        </FormControl>
                    )
                }
            case 3:
                if (typeof value == "string" && question.choices && question.choices.choices) {
                    return (
                        <FormControl>
                            <FormGroup>
                                {question.choices.choices.map((c:string,_idx:number) => (
                                    <FormControlLabel key={_idx} disabled={disable} value={_idx} control={<Checkbox />} label={c} />
                                ))}
                            </FormGroup>
                        </FormControl>
                    )
                }
        }
        return (<>Error...</>)
    }

    return (
        <Paper variant="outlined">
            <Stack spacing={2} padding={2}>
                <div>
                    <Typography variant="h5" component="div">
                        {question.name} { question.required != null ? <>
                            { question.required ? 
                                <span style={{"color": red[400]}}>&#42;</span>
                                :
                                null
                            }
                        </> : null }
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
