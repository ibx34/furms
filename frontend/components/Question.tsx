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

const Question = ({
    question,
    updateResponse,
    deleteResponseKey,
    disable
}: {
    question: {
        name: string,
        form_id: number,
        id: number,
        type: number,
        description: string
    },
    updateResponse: (question: number, input: string | boolean) => void,
    deleteResponseKey: (question: number) => void,
    disable: boolean
}) => {
    const [value, setValue] = useState<string | boolean>();

    const updateValue = (value: string | boolean) => {
        setValue(value);
        console.log(typeof value == "string");
        if (typeof value == "string" && value.toString().length <= 0) {
            return deleteResponseKey(question.id);
        }
        updateResponse(question.id, value);
    }

    const renderInput = () => {
        switch (question.type) {
            case 0:
                return (
                    <TextField 
                        variant="outlined"
                        size="small"
                        value={value}
                        onChange={(e) => updateValue(e.target.value)}
                        disabled={disable}
                    />
                )
        }
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
