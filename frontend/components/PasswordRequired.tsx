import * as React from 'react';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import { useState } from 'react';
import Paper, { IconButton } from '@mui/material';
import { DialogContentText, Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const PasswordRequired = ({open, password, setPassword, handleClose, handleSubmit}: { open: boolean, password: string, setPassword: (arg0: string) => void, handleClose: () => void, handleSubmit: () => void}) => {
    return (
        <Dialog open={open} onClose={handleClose} PaperProps={{variant: "outlined"}}>
            <DialogTitle>
                Password Required
            </DialogTitle>

            <DialogContent>
                <Stack direction="column" spacing={2}>
                    <DialogContentText>
                        The form you&apos;re trying to access requires a password. You should have recieved a password
                        if you were sent the form in the first place.
                    </DialogContentText>

                    <TextField 
                        label="Password" 
                        variant="outlined"
                        type="password"
                        autoFocus
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button color="inherit" onClick={(_) => { window.location.href="/" }}>Go Home</Button>
                <Button variant="outlined" disableElevation onClick={handleSubmit} endIcon={<ArrowForwardIcon/>}>Submit</Button>
            </DialogActions>
        </Dialog>
    );
};
export default PasswordRequired;
