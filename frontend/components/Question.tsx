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
    question
}: {
    question: {
        name: string,
        form_id: number,
        id: number,
        type: number,
        description: string
    }
}) => {

    const renderInput = () => {
        switch (question.type) {
            case 0:
                return (
                    <TextField 
                        label="Input" 
                        variant="filled"
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
