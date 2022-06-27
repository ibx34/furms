import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState, useEffect } from 'react';
import { Divider, FormControlLabel, IconButton, InputLabel, Menu, Paper, Switch, Toolbar, Typography } from '@mui/material';
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
import MoreVertIcon from '@mui/icons-material/MoreVert';
import { red } from '@mui/material/colors';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';

const Question = ({
    question,
    disable,
    index,
    updateQuestion,
    deleteQuestion
}: {
    question: QuestionType,
    disable: boolean,
    index: number,
    updateQuestion: (index: number, question: any) => void,
    deleteQuestion: (index: number) => void
}) => {
    const [_question, setQuestion] = useState<QuestionType>(question);
    const [extraOptionsOpen, openExtraOptions] = useState<boolean>(false);
    const [deleteConf, setDeleteConf] = useState<boolean>(false);
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    
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
            case 4:
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
            case 3:
                return (
                    <Stack spacing={2}>
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
                    <Toolbar disableGutters>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Question #{question.id+1}
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <IconButton onClick={(e) => {openExtraOptions(!extraOptionsOpen); setAnchorEl(e.currentTarget);}}> {/* onClick={(_) => deleteQuestion(index)} */}
                                <MoreVertIcon />
                            </IconButton>

                            <Menu
                                id="basic-menu"
                                anchorEl={anchorEl}
                                open={extraOptionsOpen}
                                onClose={(_) => {
                                    setAnchorEl(null);
                                    openExtraOptions(false)
                                }}
                                MenuListProps={{
                                'aria-labelledby': 'basic-button',
                                }}
                            >
                                <MenuItem onClick={(_) => {
                                    updateQuestionn({
                                        ..._question,
                                        required: (_question.required == null ? true : !_question.required)
                                    });
                                }}>
                                    <ListItemIcon>
                                        { _question.required == null || _question.required !== null && !_question.required ?
                                            <CheckBoxOutlineBlankIcon />
                                            :
                                            <CheckBoxIcon />
                                        }
                                    </ListItemIcon>
                                    <ListItemText>Required</ListItemText>
                                </MenuItem>

                                <MenuItem onClick={(_) => {
                                    if (!deleteConf) {
                                        setDeleteConf(!deleteConf);
                                        setTimeout(() => {
                                            setDeleteConf(false);
                                        }, 5000);
                                        return
                                    } else {
                                        deleteQuestion(index)
                                        setDeleteConf(false);
                                    }
                                }} sx={{color:red[600]}}>
                                    { deleteConf ? "Are you sure?" : "Delete Question" }
                                </MenuItem>
                            </Menu>

                        </Stack>
                    </Toolbar>
                    <Divider />
                </div>
                <Stack spacing={2} direction={"row"}>
                    <TextField 
                        variant="outlined"
                        size="small"
                        label="Name"
                        multiline
                        value={_question.name}
                        onChange={(e) => updateQuestionn({
                            ..._question,
                            name: e.target.value
                        })}
                        disabled={disable}
                    />
                    <FormControl sx={{ m: 1, minWidth: 200 }}>
                        <InputLabel>Question Type</InputLabel>
                        <Select
                            label="Question Type"
                            size="small"
                            autoWidth
                            value={_question.type}
                            onChange={(e) => {
                                let q_type = e.target.value as number;
                                if (q_type == 2 || q_type == 3) {
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
                            <MenuItem value={0}>Short-Text</MenuItem>
                            <MenuItem value={4}>Paragraph</MenuItem>
                            <MenuItem value={1}>Number</MenuItem>
                            <MenuItem value={2}>Choice</MenuItem>
                            <MenuItem value={3}>Multi-Select</MenuItem>
                        </Select>
                    </FormControl>
                </Stack>
                <TextField 
                        variant="outlined"
                        size="small"
                        label="Description"
                        multiline
                        value={_question.description}
                        onChange={(e) => updateQuestionn({
                            ..._question,
                            description: e.target.value
                        })}
                        disabled={disable}
                    />
                {renderSubOptions()}
            </Stack>
        </Paper>
    );
};
export default Question;