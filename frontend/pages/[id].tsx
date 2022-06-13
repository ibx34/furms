import { Alert, Button, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import axios from 'axios'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import PasswordRequired from '../components/PasswordRequired'
import Question from '../components/Question'
import SendIcon from '@mui/icons-material/Send';

const ShowForm: NextPage = () => {
    const { isReady, query } = useRouter();
    const [ formRequiresPassword, setFormRequiresPassword] = useState<boolean>(false);
    const [ providedFormPassword, setProvidedFormPassword] = useState<string>("");
    const [ formLoaded, setFormLoaded] = useState<boolean>(false);
    const [ form, setForm] = useState<{
        name: string,
        form_id: number,
        password: string,
        description: string
        questions: {
            name: string,
            form_id: number,
            id: number,
            type: number,
            description: string
        }[]
    }>();

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

            { form !== undefined ?
                <Grid container spacing={5} columns={24} direction="row" paddingTop={5}>
                    <Grid item xs />
                    <Grid item xs={12}>
                        <Stack spacing={4}>
                            <Paper variant="outlined" elevation={8}>
                                <Stack spacing={1} padding={2}>
                                    <Typography variant="h5" component="div">
                                        {form.name}
                                    </Typography>
                                    <Typography variant="body1" component="div">
                                        {form.description}
                                    </Typography>
                                </Stack>
                            </Paper>

                            { form.questions !== undefined || form.questions !== null ?
                                form.questions.map((question: { name: string; form_id: number; id: number; type: number }) => (
                                    <Question question={question} />
                                ))
                                :
                                null
                            }
                            
                            <Stack spacing={4} direction="row-reverse">
                                <Button variant="outlined" color="primary" endIcon={<SendIcon/>}>Submit</Button>
                            </Stack>
                        </Stack>
                    </Grid>
                    <Grid item xs />
                </Grid>
                :
                null
            }
        </div>
    )
}

export default ShowForm
