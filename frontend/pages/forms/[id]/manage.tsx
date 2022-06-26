import { Alert, AlertTitle, AppBar, Box, Button, Chip, Divider, FormControlLabel, Grid, IconButton, Paper, Stack, Switch, TextField, Toolbar, Typography } from '@mui/material'
import axios from 'axios'
import type { GetServerSideProps, NextPage } from 'next'
import Router, { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import PasswordRequired from '../../../components/PasswordRequired'
import Question from '../../../components/Question'
import EditQuestion from '../../../components/EditQuestion'
import SendIcon from '@mui/icons-material/Send';
import { red } from '@mui/material/colors'
import { CircularProgress } from '@mui/material';
import { QuestionType, FormType, ResponseAccess } from "../../../types/types";
import cookie from "cookie";
import DrawerNav from '../../../components/DrawerNav'
import FormattedInput from '../../../components/NumberInput'
import SaveIcon from '@mui/icons-material/Save';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';
import AddIcon from '@mui/icons-material/Add';

const UpdateFormQuestions = ({session}:{session: string}) => {
    const { isReady, query } = useRouter();
    const [form, setForm] = useState<FormType | null>(null);
    const [usingPassword, setUsingPassword] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState<number>(0);

    const updateForm = (newForm: FormType) => {
        setForm(newForm);
    }

    useEffect(() => {
        if (isReady && form == null) {
            axios.request(
                { withCredentials: false, method: "get", url: `${process.env.NEXT_PUBLIC_API_BASE}/api/forms/${query.id}` }
            ).then((response) => {
                setForm(response.data)
                if (response.data) {
                    if (response.data.password.length > 0) {
                        setUsingPassword(true);
                    }
                }
            }).catch((error) => {
                if (error.response && error.response.status) {
                    switch (error.response.status) {
                        case 401:
                            if (error.response.data.code !== undefined || error.response.data.code !== null) {
                                switch (error.response.data.code) {
                                    case 1:
                                        Router.push(`/api/oauth2/login?service=discord&redirect_url=${window.location}`);
                                        break;
                                        
                                    case 0:
                                        break;
                                }
                            }
                            break;
                        case 403:
                            if (error.response.data.code) {
                                switch (error.response.data.code) {
                                    case 2: 
                                        break;
                                }
                            }
                            break;
                    }
                }
            });
        }
    }, [isReady, !form, query.id])

    const renderCurrentPage = () => {
        if (form) {
            switch (currentPage) {
                case 0:
                    return (<Grid container spacing={5} columns={24}>
                        <Grid item xs>
                            <Paper variant="outlined">
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
    
                                    <Stack spacing={1}>
                                        <div>
                                            <FormControlLabel 
                                                control={
                                                    <Switch 
                                                        value={usingPassword}
                                                        checked={usingPassword}
                                                        onChange={(e) => {
                                                            if (!e.target.checked) {
                                                                updateForm({...form, password: null})
                                                            }
                                                            setUsingPassword(e.target.checked)
                                                        }} 
                                                    />
                                                } 
                                                label="Require Password" 
                                            />
                                            { usingPassword ?
                                                <Stack spacing={1}>
                                                    <Typography variant="body1" component="div">
                                                        While a password is required, people who visit your form will have to input it before
                                                        being able to access any questions or contents.
                                                    </Typography>
                                                    <TextField 
                                                        label="Password" 
                                                        variant="outlined"
                                                        type="password"
                                                        // size="small"
                                                        value={form.password}
                                                        onChange={(e) => updateForm({...form, password: e.target.value})}
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
                                                        value={form.require_auth}
                                                        checked={form.require_auth}
                                                        onChange={(e) => {
                                                            updateForm({...form, require_auth: e.target.checked})
                                                        }} 
                                                    />
                                                } 
                                                label="Requires user to be logged in" 
                                            />
                                            {form.require_auth ? 
                                                <Stack spacing={2}>
                                                    <Typography variant="body1" component="div">
                                                        When a user is required to login they will be reidrected to a Discord page to login and returned back to your form.
                                                        Enabling this will allow you to also enable: Response limits, and Connection Requirements.
                                                    </Typography>
    
                                                    <FormattedInput 
                                                        label={"Response Limit"}
                                                        number={form.resp_limit == null ? 0 : form.resp_limit} 
                                                        onChange={(n) => {
                                                            // if (n == 0) {
                                                            //     setResponseLimit(null);
                                                            // } else {
                                                            //     setResponseLimit(n);
                                                            // }
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
                        </Grid>

                        <Grid item xs>
                            <Paper variant="outlined">
                                <Stack spacing={3} padding={2}>
                                    <div>
                                        <Typography variant="h5" component="div">
                                            General Information
                                        </Typography>
                                        <Typography variant="body1" component="div">
                                            General information regarding this form. And some options to make the form public,
                                            close submissions, and change the name/description.
                                        </Typography>
                                    </div>
                                    
                                    <Stack spacing={2}>
                                        <TextField 
                                            label="name" 
                                            value={form.name}
                                            onChange={(e) => updateForm({...form, name: e.target.value})}
                                            variant="outlined"
                                        />

                                        <TextField 
                                            label="description" 
                                            value={form.description}
                                            onChange={(e) => updateForm({...form, description: e.target.value})}                                            
                                            variant="outlined"
                                            multiline
                                        />  
                                    </Stack>
                                </Stack>
                            </Paper>
                            {/* {JSON.stringify(form)} */}
                        </Grid>

                    </Grid>)
                case 1:
                    return (<div>Its the questions page!</div>)
            }
        }
    }

    return (<Box sx={{ display: 'flex' }}>
                <AppBar
                    position="fixed"
                    elevation={0}
                    color="secondary"
                    sx={{
                        width: { sm: `calc(100% - ${240}px)` },
                        ml: { sm: `${240}px` },
                    }}
                >
                    <Toolbar>
                        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
                            Managing a form
                        </Typography>
                        <Stack direction="row" spacing={2}>
                            <Button 
                                variant="contained" 
                                size="small" 
                                color="secondary" 
                                endIcon={<RemoveRedEyeIcon />}
                                disabled={form == null}
                                onClick={(_) =>{ if (form) {
                                    window.open(`/forms/${form.form_id}`, "_");
                                }}}
                             >
                                View
                            </Button>
                            <Button variant="contained" size="small" color="success" endIcon={<SaveIcon />}>Save</Button>
                        </Stack>
                    </Toolbar>
                    <Divider/>
                </AppBar>

                <DrawerNav session={session} form={form} setCurrentPage={(idx) => {setCurrentPage(idx)}}/>

                <Box
                    component="main"
                    sx={{ flexGrow: 1, p: 3, width: { sm: `calc(100% - ${240}px)` } }}
                >
                    <Toolbar />
                    {renderCurrentPage()}
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



export default UpdateFormQuestions
