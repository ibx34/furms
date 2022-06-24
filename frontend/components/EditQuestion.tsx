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
import AddIcon from '@mui/icons-material/Add';
import Tooltip from '@mui/material/Tooltip';
import { QuestionType, FormType, ChoicesType } from "../types/types";
import RemoveIcon from '@mui/icons-material/Remove';
import DeleteIcon from '@mui/icons-material/Delete';

const Question = ({
    question,
    disable,
    index,
    updateQuestion,
    //wait to delete questions.
    //deleteQuestion
}: {
    question: QuestionType,
    disable: boolean,
    index: number,
    updateQuestion: (index: number, question: any) => void,
    //deleteQuestion: (index: number) => void
}) => {
    const [_question, setQuestion] = useState<QuestionType>(question);

    const updateChoiceValue = (idx: number, newValue: string) => {
        if (_question.choices) {
            if (_question.choices.choices) {
                _question.choices.choices[idx] = newValue;
                updateQuestionn({
                    ..._question,
                    choices: {
                        ..._question.choices,
                        choices: _question.choices.choices
                    }
                })
            }
        }
    }

    const deleteChoice = (idx:number) => {
        if (_question.choices && _question.choices.choices) {
            _question.choices.choices.splice(idx, 1);
            updateChoiceSettings({
                ..._question.choices,
                choices: _question.choices.choices
            })
        }
    }

    const renderSubOptions = () => {
        switch (_question.type) {
            case 0:
                return (
                    <Stack spacing={2}>
                        <div>
                            <Typography variant="h6" component="div">
                                Text Options
                            </Typography>
                        </div>

                        <Stack spacing={2} direction="row">
                            <FormattedInput 
                                label={"Min"} 
                                number={_question.min != null ? _question.min : 0} 
                                onChange={(n) => updateQuestionn({
                                    ..._question,
                                    min: n == 0 ? null : n
                                })}
                                disable={false}
                            /> 
                            <FormattedInput 
                                label={"Max"} 
                                number={_question.max != null ? _question.max : 0} 
                                onChange={(n) => updateQuestionn({
                                    ..._question,
                                    max: n == 0 ? null : n
                                })}
                                disable={false}
                            /> 
                        </Stack>
                    </Stack>
                )

            case 2:
                return (
                    <Stack spacing={2}>
                        <div>
                            <Typography variant="h6" component="div">
                                Choice Options
                            </Typography>
                        </div>

                        <Stack spacing={2}>
                            <div>
                                <FormControlLabel 
                                    control={
                                        <Switch 
                                            value={_question.choices == null ? false : _question.choices.multiple_sections} 
                                            onChange={(e) => {
                                                if (_question.choices) {
                                                    updateChoiceSettings({
                                                        ..._question.choices,
                                                        multiple_sections: e.target.checked
                                                    })                                                    
                                                } else {
                                                    updateChoiceSettings({
                                                        choices: [],
                                                        multiple_sections: e.target.checked
                                                    })
                                                }
                                            }} 
                                        />
                                    } 
                                    label="Allow multiple selections" 
                                />
                            </div>
                        </Stack>
                        
                        { _question.choices != null && _question.choices.choices != null ? 
                            <Stack spacing={2}>
                                <Typography variant="h6" component="div">
                                    Choices
                                </Typography>
                                
                                {_question.choices.choices.map((_, idx: number) => {
                                    return (<Stack key={idx} spacing={1} direction="row">
                                        <TextField 
                                            variant="outlined"
                                            size="small"
                                            label={`Choice ${idx+1}`}
                                            value={_question.choices!.choices![idx]}
                                            onChange={(e) => updateChoiceValue(idx,e.target.value)}
                                            disabled={disable}
                                        />
                                        <IconButton 
                                            disabled={disable}
                                            onClick={(_) => deleteChoice(idx)}
                                        >
                                            <RemoveIcon />
                                        </IconButton>
                                    </Stack>)
                                })}
                                <Divider>
                                    <IconButton disabled={disable} onClick={(_) => {
                                        if (_question.choices) {
                                            if (_question.choices.choices) {
                                                updateQuestionn({
                                                    ..._question,
                                                    choices: {
                                                        ..._question.choices,
                                                        choices: [..._question.choices.choices, ""]
                                                    }
                                                })
                                            }
                                        }
                                    }}>
                                        <AddIcon />
                                    </IconButton>
                                </Divider>
                            </Stack>
                            :
                            null
                        }
                    </Stack>
                )                
        }
    }

    const updateChoiceSettings = (choices: ChoicesType) => {
        updateQuestionn({
            ..._question,
            choices: choices
        })
    }

    const updateQuestionn = (question: QuestionType) => {
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
                        onChange={(e) => {
                            let q_type = e.target.value as number;
                            if (q_type == 2) {
                                updateQuestionn({
                                    ..._question,
                                    type: q_type,
                                    choices: {
                                        choices: [],
                                        multiple_sections: false
                                    }
                                });                            
                            } else {
                                updateQuestionn({
                                    ..._question,
                                    type: q_type
                                });
                            }
                        }}
                        disabled={disable}
                    >
                        <MenuItem value={0}>Text</MenuItem>
                        <MenuItem value={1}>Number</MenuItem>
                        <MenuItem value={2}>Choice</MenuItem>
                    </Select>
                </FormControl>
                {renderSubOptions()}
            </Stack>
        </Paper>
    );
};
export default Question;