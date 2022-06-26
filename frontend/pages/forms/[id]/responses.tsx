import { Alert, AlertTitle, Box, Button, Divider, FormControl, Grid, InputLabel, MenuItem, Paper, Select, Stack, Tab, Tabs, Typography } from '@mui/material'
import axios from 'axios'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import PasswordRequired from '../../../components/PasswordRequired'
import Question from '../../../components/Question'
import SendIcon from '@mui/icons-material/Send';
import { grey, red, yellow } from '@mui/material/colors'
import { CircularProgress } from '@mui/material';
import { QuestionType, FormType, Response } from "../../../types/types";
import FlagIcon from '@mui/icons-material/Flag';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';

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
    const [tab, setSelectedTab] = useState(0);

    useEffect(() => {
        if (isReady) {
            if (isReady && !formLoaded) {
                axios.request(
                    { withCredentials: false, method: "get", url: `${process.env.NEXT_PUBLIC_API_BASE}/api/forms/${query.id}` }
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
                    { withCredentials: false, method: "get", url: `${process.env.NEXT_PUBLIC_API_BASE}/api/forms/${query.id}/responses` }
                ).then((response) => {
                    setResponses(response.data.responses);
                }).catch((error) => {});
                setResponsesLoaded(true);            
            }
        }
    }, [isReady, formLoaded, responsesLoaded, query.id])

    const renderTab = () => {
        switch (tab) {
            case 0:
                if (form) {
                    return (
                        <Stack spacing={2}>
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
                    )
                }
        }
    }

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
                                url: `${process.env.NEXT_PUBLIC_API_BASE}/api/forms/${query.id}`,
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
                            <Paper variant="outlined">
                                <Stack spacing={3} padding={2}>
                                    <div>
                                        <Typography variant="h5" component="div">
                                            Responses for &quot;<strong>{form.name}</strong>&quot;
                                        </Typography>
                                        <Typography variant="body2" component="div">
                                            <strong>{responses.length}</strong> responses<br/>
                                            { responses[currentResponse] != null ? 
                                                <div>
                                                    Submitted at <strong>{new Date(responses[currentResponse].submitted_at).toString()}</strong>
                                                </div>
                                                : null                                            
                                            }
                                        </Typography>
                                    </div>

                                    <Stack spacing={2} direction={"row"}>
                                        <Button variant="outlined" size="small" color="error" endIcon={<FlagIcon />}>Report Response</Button>
                                        <Button 
                                            variant="outlined" 
                                            size="small" 
                                            color="primary" 
                                            endIcon={<CloudDownloadIcon />}
                                            onClick={(_) => {
                                                if (responses[currentResponse]) {
                                                    window.open(`${process.env.NEXT_PUBLIC_API_BASE}/api/forms/${query.id}/responses/${responses[currentResponse].id}`)
                                                }
                                            }}
                                        >
                                            Download
                                        </Button>
                                    </Stack>
                                </Stack>
                            </Paper>
                            <Paper variant="outlined">
                                <Tabs value={tab} onChange={(event: React.SyntheticEvent, newValue: number) => setSelectedTab(newValue)} centered>
                                    <Tab label="Responses" />
                                    <Tab label="Current Response Author" />
                                </Tabs>
                            </Paper>
                            <Divider>
                                <Stack spacing={1} direction="row">
                                    <Button 
                                        variant="outlined" 
                                        color="primary"
                                        onClick={(_) => {
                                            if (responses && responses[currentResponse-1]) {
                                                setCurrentResponse(currentResponse-1);
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
                                                setCurrentResponse(currentResponse+1);
                                            }
                                        }}
                                    >
                                        Next
                                    </Button>
                                </Stack>
                            </Divider>

                            <Stack spacing={2}>
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
