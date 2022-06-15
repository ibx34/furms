import { Alert, AlertTitle, Button, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import axios from 'axios'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import PasswordRequired from '../../components/PasswordRequired'
import Question from '../../components/Question'
import SendIcon from '@mui/icons-material/Send';
import { red } from '@mui/material/colors'
import { CircularProgress } from '@mui/material';

const ShowForm: NextPage = () => {
    const { isReady, query } = useRouter();
    const [ formRequiresPassword, setFormRequiresPassword] = useState<boolean>(false);
    const [ formSubmitted, setFormSubmitted] = useState<boolean>(false);
    const [ processingForm, setProcessingForm] = useState<boolean>(false);
    const [ providedFormPassword, setProvidedFormPassword] = useState<string>("");
    const [ questionResponses, setQuestionResponses] = useState<{
        [key:number]: {
            response: string | boolean
        }
    }>({});
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
    const [formErrors, setFormErrors] = useState<{
        code: number,
        message: string
    }[]>([]);

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

    const updateFormResponse = (question: number, input: string | boolean) => {
        setQuestionResponses({ ...questionResponses, [question]: {
            response: input
        }});
    }

    const deleteResponseKey = (question: number) => {
        delete questionResponses[question];
        setQuestionResponses({...questionResponses});
    }

    const checkFormIsGood = (): any[]  => {
        let final_errors = [];
        if (Object.keys(questionResponses).length <= 0) {
            final_errors.push({
                code: 0,
                message: "Cannot submit an empty form."
            });
        }
        return final_errors;
    }

    const submitResponse = () => {
        setProcessingForm(true);
        let errors = checkFormIsGood();
        if (errors.length > 0) {
            setFormErrors(errors);
            setProcessingForm(false);          
            return;
        }
        setFormErrors([]);

        let true_responses: {id: number, response: string | boolean}[] = [];
        Object.keys(questionResponses).forEach((key, index) => {
            let question = questionResponses[index];
            true_responses.push({
                id: index,
                response: question.response
            });            
        });
        axios.request(
            {withCredentials: false, method:"post",url:`http://localhost:8080/forms/${query.id}/respond`,
                data: {
                    "responses": true_responses
                }
            }
        ).then((response) => {
            setFormSubmitted(true);
            setProcessingForm(false);
        }).catch((error) => {});

    }

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
                    { !formSubmitted ? 
                        <Stack spacing={4}>
                            { formErrors.length > 0 ?
                                <Alert severity='error'>
                                    <AlertTitle>There were some problems with the form you tried to submit.</AlertTitle>
                                    {formErrors.map((err: any) => (
                                        <Typography variant="body1" component="div">
                                            &#8226; {err.message} (CODE: {err.code})
                                        </Typography>
                                    ))}
                                </Alert>
                                :
                                null
                            }

                            <Paper variant="outlined" elevation={8}>
                                <Stack spacing={1} padding={3}>
                                    <Typography variant="h5" component="div">
                                        {form.name}
                                    </Typography>
                                    <Typography variant="body1" component="div">
                                        {form.description}
                                    </Typography>
                                    <Stack spacing={2}>
                                        <Divider />
                                        <Typography variant="body1" component="div" color={red[500]}>
                                            Never give forms your password or any other sensitive information.
                                        </Typography>
                                    </Stack>
                                </Stack>
                            </Paper>

                            { form.questions != undefined || form.questions != null ?
                                form.questions.map((question: { name: string; form_id: number; id: number; type: number, description: string }) => (
                                    <Question question={question} updateResponse={updateFormResponse} deleteResponseKey={deleteResponseKey} disable={processingForm} />
                                ))
                                :
                                null
                            }
                            
                            <Stack spacing={2} direction="row-reverse">
                                { !processingForm ?
                                    <Button 
                                        variant="outlined" 
                                        color="primary" 
                                        endIcon={<SendIcon/>} 
                                        onClick={submitResponse} 
                                        disabled={processingForm}
                                    >
                                        Submit
                                    </Button>
                                    :
                                    <CircularProgress size={24} /> 
                                }
                                <Button variant="text" color="inherit" disabled={processingForm}>Save as Draft</Button>
                            </Stack>
                        </Stack>
                        :
                        <Paper variant="outlined">
                            <Stack spacing={1} padding={3}>
                                <Typography variant="h5" component="div">
                                    Form Submitted
                                </Typography>
                                <Typography variant="body1" component="div">
                                    Placeholder for the real thank you page or smth.
                                </Typography>
                            </Stack>

                            <Stack spacing={2} padding={3} direction="row-reverse">
                                <Button variant="text" color="primary" onClick={(_) => { window.location.href="/" }}>Go Home</Button>
                            </Stack>
                        </Paper>
                    }
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
