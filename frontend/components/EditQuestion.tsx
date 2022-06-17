import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState, useEffect } from 'react';
import { Divider, FormControlLabel, IconButton, InputLabel, Paper, Switch, Typography } from '@mui/material';
import { DialogContentText, Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import MuiInput from '@mui/material/Input';
import FormattedInput from './NumberInput';

const Question = ({
    question,
    disable,
    index,
    updateQuestion
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
    disable: boolean,
    index: number,
    updateQuestion: (index: number, question: any) => void
}) => {
    const [max, setMax] = useState<number>(0);
    const [min, setMin] = useState<number>(0);
    const [_question, setQuestion] = useState<{
        name: string,
        form_id: number,
        id: number,
        type: number,
        description: string,
        min: number | null,
        max: number | null
    }>(question);

    const renderSubOptions = () => {
        switch (_question.type) {
            case 0:
                return (
                    <Stack spacing={2}>
                        <div>
                            <Typography variant="h6" component="div">
                                Text Options
                            </Typography>
                            <Divider />
                        </div>

                        <Stack spacing={2} direction="row">
                            <FormattedInput 
                                label={"Min"} 
                                number={_question.min != null ? _question.min : 0} 
                                onChange={(n) => updateQuestionn({
                                    ..._question,
                                    min: n == 0 ? null : n
                                })}
                            /> 
                            <FormattedInput 
                                label={"Max"} 
                                number={_question.max != null ? _question.max : 0} 
                                onChange={(n) => updateQuestionn({
                                    ..._question,
                                    max: n == 0 ? null : n
                                })}
                            /> 
                        </Stack>
                    </Stack>
                )
        }
    }

    const updateQuestionn = (question: {
        name: string,
        form_id: number,
        id: number,
        type: number,
        description: string,
        min: number | null,
        max: number | null
    }) => {
        setQuestion(question);
        updateQuestion(index, 
            question
        );
    }

    return (
        <Paper variant="outlined" elevation={8}>
            <Stack spacing={3} padding={3}>
                <div>
                    <Typography variant="h6" component="div">
                        Question #{question.id+1}
                    </Typography>
                    <Divider />
                </div>
                <TextField 
                    variant="outlined"
                    size="small"
                    label="Name"
                    value={_question.name}
                    onChange={(e) => updateQuestionn({
                        ..._question,
                        name: e.target.value
                    })}
                    disabled={disable}
                />
                <FormControl fullWidth>
                    <InputLabel>Question Type</InputLabel>
                    <Select
                        label="Question Type"
                        size="small"
                        value={_question.type}
                        onChange={(e) => updateQuestionn({
                            ..._question,
                            type: e.target.value as number
                        })}
                        disabled={disable}
                    >
                        <MenuItem value={0}>Text</MenuItem>
                        <MenuItem value={1}>Number</MenuItem>
                    </Select>
                </FormControl>
                {renderSubOptions()}
            </Stack>
        </Paper>
    );
};
export default Question;