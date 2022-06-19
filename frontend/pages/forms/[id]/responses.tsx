import { Alert, AlertTitle, Button, Divider, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, Typography } from '@mui/material'
import axios from 'axios'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import PasswordRequired from '../../../components/PasswordRequired'
import Question from '../../../components/Question'
import SendIcon from '@mui/icons-material/Send';
import { red, yellow } from '@mui/material/colors'
import { CircularProgress } from '@mui/material';
import { QuestionType, FormType, Response } from "../../../types/types";

const ShowFormResponses: NextPage = () => {
    const { isReady, query } = useRouter();
    const [formRequiresPassword, setFormRequiresPassword] = useState<boolean>(false);
    const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
    const [processingForm, setProcessingForm] = useState<boolean>(false);
    const [providedFormPassword, setProvidedFormPassword] = useState<string>("");
    const [formLoaded, setFormLoaded] = useState<boolean>(false);
    const [responsesLoaded, setResponsesLoaded] = useState<boolean>(false);
    const [form, setForm] = useState<FormType>();
    const [responses, setResponses] = useState<Response[]>([]);
    const [currentResponse, setCurrentResponse] = useState<number>(0);

    useEffect(() => {
        if (isReady) {
            if (isReady && !formLoaded) {
                axios.request(
                    { withCredentials: false, method: "get", url: `http://localhost:3001/api/forms/${query.id}` }
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

            if (isReady && formLoaded && !responsesLoaded) {
                axios.request(
                    { withCredentials: false, method: "get", url: `http://localhost:3001/api/forms/${query.id}/responses` }
                ).then((response) => {
                    setResponses(response.data.responses);
                }).catch((error) => {});
                setResponsesLoaded(true);            
            }
        }
    }, [isReady, formLoaded, responsesLoaded, query.id])

    return (
        <div>
            <PasswordRequired
                open={formRequiresPassword}
                handleClose={() => { }}
                password={providedFormPassword}
                setPassword={setProvidedFormPassword}
                handleSubmit={() => {
                    if (providedFormPassword.length > 0) {
                        axios.request(
                            {
                                withCredentials: false,
                                method: "get",
                                url: `http://localhost:3001/api/forms/${query.id}`,
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

            { form ?
                <Grid container spacing={5} columns={24} direction="row" paddingTop={5}>
                    <Grid item xs />
                    <Grid item xs={12}>
                        <Stack spacing={4}>
                            <Paper variant="outlined" elevation={8}>
                                <Stack spacing={3} padding={2}>
                                    <div>
                                        <Typography variant="h5" component="div">
                                            Responses for &quot;<strong>{form.name}</strong>&quot;
                                        </Typography>
                                    </div>
                                </Stack>
                            </Paper>
                            <Divider>
                                <Stack spacing={1} direction="row">
                                    <Button 
                                        variant="outlined" 
                                        color="primary"
                                        onClick={(_) => {
                                            if (responses && responses[currentResponse-1]) {
                                                setCurrentResponse(currentResponse-1)
                                            }
                                        }}
                                    >
                                        Back
                                    </Button>
                                    <Button 
                                        variant="outlined" 
                                        color="primary"
                                        onClick={(_) => {
                                            if (responses && responses[currentResponse+1]) {
                                                setCurrentResponse(currentResponse+1)
                                            }
                                        }}
                                    >
                                        Next
                                    </Button>
                                </Stack>
                            </Divider>

                            { responses[currentResponse] != null ?
                                <div>
                                    <Stack spacing={2}>
                                        { responses[currentResponse].responses.map((response,idx:number) => (
                                            <Question 
                                                key={idx}
                                                question={form.questions[response.id]} 
                                                startingValue={response.response} 
                                                disable={true} 
                                                updateResponse={function (question: number, input: string | number | boolean): void {} } 
                                                deleteResponseKey={function (question: number): void {} }
                                            />
                                        ))}
                                    </Stack>
                                </div>
                                :
                                null
                            }
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

export default ShowFormResponses
