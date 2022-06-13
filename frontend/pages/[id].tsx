import { Alert, Grid, Paper, Stack, Typography } from '@mui/material'
import axios from 'axios'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import PasswordRequired from '../components/PasswordRequired'

const ShowForm: NextPage = () => {
    const { isReady, query } = useRouter();
    const [ formRequiresPassword, setFormRequiresPassword] = useState<boolean>(false);
    const [ providedFormPassword, setProvidedFormPassword] = useState<string>("");
    const [ formLoaded, setFormLoaded] = useState<boolean>(false);
    const [ form, setForm] = useState<any>();

    useEffect(() => {		
        if (isReady && !formLoaded) {
            axios.request(
                {withCredentials: false, method:"get",url:`http://localhost:8080/forms/${query.id}`}
            ).then((response) => {
                setForm(response.data)
            }).catch((error) => {
                if (error.response.status) {
                    switch (error.response.status) {
                        case 401:
                            setFormRequiresPassword(true);
                            break;
                    }
                }
            });
            setFormLoaded(true);
        }
    })

    return (
        <div>
            <PasswordRequired 
                open={formRequiresPassword} 
                handleClose={() => {}} 
                password={providedFormPassword} 
                setPassword={setProvidedFormPassword}
                handleSubmit={() => {
                    if (providedFormPassword.length > 0) {
                        axios.request(
                            {
                                withCredentials: false, 
                                method:"get",
                                url:`http://localhost:8080/forms/${query.id}`,
                                headers: {
                                    'X-Password': providedFormPassword
                                }
                            }
                        ).then((response) => {
                            setForm(response.data);
                            setFormRequiresPassword(false);
                        }).catch((error) => {
                            if (error.response.status) {
                                switch (error.response.status) {
                                    case 401:
                                        setFormRequiresPassword(true);
                                        break;
                                    case 403:
                                        setFormRequiresPassword(false);
                                        break;                                        
                                }
                            }
                        });
                    }                  
                }}
            />
            <Grid container spacing={5} columns={16} direction="row" paddingTop={5}>
                <Grid item xs />
                <Grid item xs={8}>
                    { form !== undefined ?
                        <Paper variant="outlined" elevation={8}>
                            <Stack spacing={1} padding={2}>
                                <Typography variant="h3" component="div">
                                    {form["name"]}
                                </Typography>
                                <Typography variant="body1" component="div">
                                    {form["description"]}
                                </Typography>
                                
                            </Stack>
                        </Paper>
                        :
                        null
                    }
                </Grid>
                <Grid item xs />
            </Grid>
        </div>
    )
}

export default ShowForm
