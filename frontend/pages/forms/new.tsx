import { Divider, Grid, Paper, Stack, TextField, Typography, Switch, FormControlLabel, Button, Alert, AlertTitle, Box, DialogTitle, Dialog, DialogContent, DialogContentText, DialogActions } from '@mui/material'
import type { GetServerSideProps, NextPage } from 'next'
import { useState } from 'react';
import axios from 'axios';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import FormattedInput from '../../components/NumberInput';
import DrawerNav from '../../components/DrawerNav';
import cookie from "cookie";

const NewForm = ({session}:{session: null | string}) => {
    const [usingPassword, setUsingPassword] = useState<boolean>(false);
    const [publicForm, setPublicForm] = useState<boolean>(false);
    const [requestError, setRequestError] = useState<string>("");
    const [responseLimit, setResponseLimit] = useState<number | null>(null);
    const [requireLoggedIn, setRequireLoggedIn] = useState<boolean>(true);
    const [usingDiscordConnection, setUsingDiscordConnection] = useState<boolean>(false);
    const [formName, setFormName] = useState<string>();
    const [creatingForm, setCreatingForm] = useState<boolean>();
    const [formErrors, setFormErrors] = useState<{
        code: number,
        message: string
    }[]>([]);
    const [formDescription, setFormDescription] = useState<string>();
    const [formPassword, setFormPassword] = useState<string | null>(null);

    const checkFormIsGood = (): any[]  => {
        let final_errors = [];
        if (!formName || (formName && formName.length <= 0)) {
            final_errors.push({
                code: 1,
                message: "Form name must be more than 0 characters long."
            });     
        }

        if (usingPassword) {
            if (!formPassword || (formPassword != null && formPassword.length <= 0)) {
                final_errors.push({
                    code: 2,
                    message: "Form password must be above 0 characters if set."
                });                  
            }
        }

        if (publicForm) {
            if (!requireLoggedIn) {
                final_errors.push({
                    code: 3,
                    message: "You must require users to be logged in to enable public mode."
                });                  
            }
        }
        return final_errors;
    }

    const createForm = () => {
        let errors = checkFormIsGood();
        if (errors.length > 0) {
            setFormErrors(errors);            
            setCreatingForm(false);
            return;
        }
        setFormErrors([]);

        axios.request(
            {withCredentials: false, method:"post",url:`${process.env.NEXT_PUBLIC_API_BASE}/api/forms/new`,
                data: {
                    "name": formName,
                    "description": formDescription,
                    "password": formPassword,
                    "auth": requireLoggedIn,
                    "limit": responseLimit
                }
            }
        ).then((response) => {
            console.log(response.data)
            setRequestError("");
            window.location.href = `/forms/${response.data.form_id}/questions`;
        }).catch((error) => {
            if (error.response.status) {
                switch (error.response.status) {
                    case 403:
                        setRequestError("Failed to create your form. This is most likely due to form creation being restricted. If you believe this is a mistake contact the site admins.");
                        break;
                }
            }
        });
        setCreatingForm(false);
    }

    return (
        <Box sx={{ display: 'flex' }}>
            <Dialog open={requestError.length > 0} onClose={() => { }} PaperProps={{variant: "outlined"}}>
                <DialogTitle>
                    Failed to create form
                </DialogTitle>

                <DialogContent>
                    <Stack direction="column" spacing={2}>
                        <DialogContentText>
                            {requestError}
                        </DialogContentText>
                    </Stack>
                </DialogContent>
                <Divider />
                <DialogActions>
                    <Button variant={"outlined"} disableFocusRipple onClick={(_) => { window.location.href="/" }}>Go Home</Button>
                </DialogActions>
            </Dialog>


            <DrawerNav session={session} form={null} setCurrentPage={(_) => {}}/>
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
            >
                <Grid container spacing={5} columns={24} direction="row" paddingTop={5}>
                    <Grid item xs />
                    <Grid item xs={12}>
                        <Stack spacing={4}>
                            { formErrors.length > 0 ?
                                <Alert severity='error' variant="outlined">
                                    <AlertTitle>There were some problems with the form you tried to create.</AlertTitle>
                                    {formErrors.map((err: any, idx:number) => (
                                        <Typography key={idx} variant="body1" component="div">
                                            &#8226; {err.message} (CODE: {err.code})
                                        </Typography>
                                    ))}
                                </Alert>
                                :
                                null
                            }

                            <Paper variant="outlined" elevation={8}>
                                <Stack spacing={3} padding={2}>
                                    <div>
                                        <Typography variant="h5" component="div">
                                            New Form
                                        </Typography>
                                        <Typography variant="body1" component="div">
                                            Meow create a new form or somthing nya
                                        </Typography>
                                    </div>

                                    <Stack spacing={1}>
                                        <TextField 
                                            label="name" 
                                            value={formName}
                                            onChange={(e) => setFormName(e.target.value)}
                                            variant="outlined"
                                            size="small"
                                        />

                                        <TextField 
                                            label="description" 
                                            value={formDescription}
                                            onChange={(e) => setFormDescription(e.target.value)}
                                            variant="outlined"
                                            size="small"
                                            multiline
                                        />  
                                        <div>
                                            <FormControlLabel 
                                                control={
                                                    <Switch 
                                                        value={publicForm}
                                                        checked={publicForm}
                                                        onChange={(e) => {
                                                            setPublicForm(e.target.checked);
                                                        }} 
                                                    />
                                                } 
                                                label="Public form" 
                                            />

                                            { publicForm ?
                                                <Alert severity='warning' variant="outlined">
                                                    Public forms can be searched, viewed, and answered by anyone. Do not include any personal
                                                    information or content that may make some users uncomfortable.
                                                </Alert>
                                                :
                                                null
                                            }
                                        </div>
                                    </Stack>
                                </Stack>
                            </Paper>
                                    
                            <Paper variant="outlined" elevation={8}>
                                <Stack spacing={3} padding={2}>
                                    <div>
                                        <Typography variant="h5" component="div">
                                            Access Rights
                                        </Typography>
                                        <Typography variant="body1" component="div">
                                            Change how and who can access your form. Require connections, a user to be logged in
                                            or flat out lock your form to some specific people.
                                        </Typography>
                                    </div>

                                    <Stack spacing={2}>
                                        <div>
                                            <FormControlLabel 
                                                control={
                                                    <Switch 
                                                        value={usingPassword}
                                                        checked={usingPassword}
                                                        onChange={(e) => {
                                                            setUsingPassword(e.target.checked);
                                                            if (!usingPassword) {
                                                                setFormPassword(null);
                                                            }
                                                        }} 
                                                    />
                                                } 
                                                label="Require Password" 
                                            />
                                            { usingPassword ?
                                                <Stack spacing={2}>
                                                    <Typography variant="body1" component="div">
                                                        While a password is required, people who visit your form will have to input it before
                                                        being able to access any questions or contents.
                                                    </Typography>
                                                    <TextField 
                                                        label="Password" 
                                                        variant="outlined"
                                                        type="password"
                                                        size="small"
                                                        value={formPassword}
                                                        onChange={(e) => setFormPassword(e.target.value)}
                                                    />
                                                </Stack>
                                                :
                                                null
                                            }
                                        </div>
                                        
                                        <div>
                                            <FormControlLabel 
                                                control={
                                                    <Switch 
                                                        value={requireLoggedIn}
                                                        checked={requireLoggedIn}
                                                        onChange={(e) => {
                                                            setRequireLoggedIn(e.target.checked);
                                                        }} 
                                                    />
                                                } 
                                                label="Requires user to be logged in" 
                                            />
                                            {requireLoggedIn ? 
                                                <Stack spacing={2}>
                                                    <Typography variant="body1" component="div">
                                                        When a user is required to login they will be reidrect to a Discord page to login and returned back to your form.
                                                        Enabling this will allow you to also enable: Response limits, and Connection Requirements.
                                                    </Typography>

                                                    <FormattedInput 
                                                        label={"Response Limit"}
                                                        number={responseLimit == null ? 0 : responseLimit} 
                                                        onChange={(n) => {
                                                            if (n == 0) {
                                                                setResponseLimit(null);
                                                            } else {
                                                                setResponseLimit(n);
                                                            }
                                                        }}
                                                        disable={false}
                                                    />
                                                </Stack>
                                                :
                                                null
                                            }
                                        </div>
                                    </Stack>
                                </Stack>
                            </Paper>

                            <Stack spacing={4} direction="row-reverse">
                                <Button variant="outlined" color="primary" onClick={createForm} endIcon={<ArrowForwardIcon/>}>Next: Questions</Button>
                            </Stack>
                        </Stack>
                    </Grid>
                    <Grid item xs />
                </Grid>
            </Box>
        </Box>
    )
}

export const getServerSideProps: GetServerSideProps = async context => {
	let session = null;
	if (context.req.headers.cookie) {
		let cookies = cookie.parse(context.req.headers.cookie);
		if (cookies["session"]) {
			session = cookies["session"];			
		}
	}
  	return { props: { session: session } }
}


export default NewForm
