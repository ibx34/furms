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

const ConnectionRequired = ({open, handleClose}: { open: boolean, handleClose: () => void}) => {
    return (
        <Dialog open={open} onClose={handleClose} PaperProps={{elevation: 3, variant: "outlined"}}>
            <DialogTitle>
                Connection Required
            </DialogTitle>

            <DialogContent>
                <Stack direction="column" spacing={2}>
                    <DialogContentText>
                        The form you&apos;re trying to access requests that you have a <strong>Discord</strong> account connected. Please login below with your Discord account.
                    </DialogContentText>
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button color="inherit" onClick={(_) => { window.location.href="/" }}>Go Home</Button>
                <Button variant="outlined" disableElevation onClick={(_) => window.location.href="/api/oauth2/login?service=discord"}>Login</Button>
            </DialogActions>
        </Dialog>
    );
};
export default ConnectionRequired;
