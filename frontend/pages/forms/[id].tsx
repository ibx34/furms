import { Alert, AlertTitle, Button, Dialog, DialogContent, DialogContentText, DialogTitle, Divider, Grid, Paper, Stack, Typography } from '@mui/material'
import axios from 'axios'
import type { NextPage } from 'next'
import Router, { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import PasswordRequired from '../../components/PasswordRequired'
import ConnectionRequired from '../../components/ConnectionRequired'
import Question from '../../components/Question'
import SendIcon from '@mui/icons-material/Send';
import { red, yellow } from '@mui/material/colors'
import { CircularProgress } from '@mui/material';
import { QuestionType, FormType } from "../../types/types";
import FlagIcon from '@mui/icons-material/Flag';

const ShowForm: NextPage = () => {
    const { isReady, query } = useRouter();
    const [formRequiresPassword, setFormRequiresPassword] = useState<boolean>(false);
    const [formRequiresConnection, setFormRequiresConnection] = useState<boolean>(false);
    const [formSubmitted, setFormSubmitted] = useState<boolean>(false);
    const [formFailedConnectionCheck, setformFailedConnectionCheck] = useState<boolean>(false);
    const [formMaxAttemptsHit, setFormMaxAttemptsHit] = useState<boolean>(false);
    const [processingForm, setProcessingForm] = useState<boolean>(false);
    const [providedFormPassword, setProvidedFormPassword] = useState<string>("");
    const [questionResponses, setQuestionResponses] = useState<{
        [key: number]: {
            response: string | boolean | number
        }
    }>({});
    const [formLoaded, setFormLoaded] = useState<boolean>(false);
    const [form, setForm] = useState<FormType>();
    const [formErrors, setFormErrors] = useState<{
        code: number,
        message: string
    }[]>([]);

    useEffect(() => {
        if (isReady && !formLoaded) {
            axios.request(
                { withCredentials: false, method: "get", url: `${process.env.NEXT_PUBLIC_API_BASE}/api/forms/${query.id}` }
            ).then((response) => {
                setForm(response.data)
            }).catch((error) => {
                if (error.response.status) {
                    switch (error.response.status) {
                        case 401:
                            if (error.response.data.code !== undefined || error.response.data.code !== null) {
                                switch (error.response.data.code) {
                                    case 1:
                                        Router.push(`/api/oauth2/login?service=discord&redirect_url=${window.location}`);
                                        break;
                                        
                                    case 0:
                                        setFormRequiresPassword(true);
                                        break;
                                }
                            }
                            break;
                        case 403:
                            if (error.response.data.code) {
                                switch (error.response.data.code) {
                                    case 2: 
                                        setformFailedConnectionCheck(true);
                                        break;
                                }
                            }
                            break;
                    }
                }
            });
            setFormLoaded(true);
        }
    }, [isReady, formLoaded, query.id])

    const updateFormResponse = (question: number, input: string | boolean | number) => {
        setQuestionResponses({
            ...questionResponses, [question]: {
                response: input
            }
        });
    }

    const deleteResponseKey = (question: number) => {
        delete questionResponses[question];
        setQuestionResponses({ ...questionResponses });
    }

    const checkFormIsGood = (): any[] => {
        let final_errors = [];
        if (Object.keys(questionResponses).length <= 0) {
            final_errors.push({
                code: 0,
                message: "Cannot submit an empty form."
            });
        }

        if (form) {
            for (let question of form.questions) {
                if (question.required && !Object.keys(questionResponses).includes(question.id.toString())) {
                    final_errors.push({
                        code: 1,
                        message: `Missing required question: "${question.name}"`
                    });                    
                }
            }       
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

        let true_responses: { id: number, response: string | boolean | number }[] = [];
        Object.keys(questionResponses).forEach((key, index) => {
            let question = questionResponses[Number(key)];
            true_responses.push({
                id: index,
                response: question.response
            });
        });
        axios.request(
            {
                withCredentials: false, method: "post", url: `${process.env.NEXT_PUBLIC_API_BASE}/api/forms/${query.id}/respond`,
                data: {
                    "responses": true_responses
                }
            }
        ).then((response) => {
            setFormSubmitted(true);
            setProcessingForm(false);
        }).catch((error) => {
            if (error.response.status) {
                switch (error.response.status) {
                    case 403:
                        setFormMaxAttemptsHit(true);
                        break;
                }
            }
        });

    }

    return (
        <div>
            <Dialog open={formMaxAttemptsHit} onClose={() => { }} PaperProps={{variant: "outlined"}}>
                <DialogTitle>
                    Max amount of responses reached.
                </DialogTitle>

                <DialogContent>
                    <Stack direction="column" spacing={2}>
                        <DialogContentText>
                            You have reached the maximum amount of allowed responses.
                        </DialogContentText>
                    </Stack>
                </DialogContent>
            </Dialog>

            <Dialog open={formFailedConnectionCheck} onClose={() => { }} PaperProps={{variant: "outlined"}}>
                <DialogTitle>
                    Connection Required
                </DialogTitle>

                <DialogContent>
                    <Stack direction="column" spacing={2}>
                        <DialogContentText>
                            This form requires you have a Discord connection. Please connect your Discord account before revisiting this form.
                        </DialogContentText>
                    </Stack>
                </DialogContent>
            </Dialog>

            <ConnectionRequired 
                open={formRequiresConnection}
                handleClose={() => { }}            
            />
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
            
            {formRequiresPassword}

            {form !== undefined ?
                <Grid container spacing={5} columns={24} direction="row" paddingTop={5}>
                    <Grid item xs />
                    <Grid item xs={12}>
                        {!formSubmitted ?
                            <Stack spacing={4}>
                                {formErrors.length > 0 ?
                                    <Alert severity='error'>
                                        <AlertTitle>There were some problems with the form you tried to submit.</AlertTitle>
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

                                {form.questions != undefined || form.questions != null ?
                                    form.questions.map((question: QuestionType, idx:number) => {
                                        let startingValue = (): string | number | boolean | undefined => {
                                            switch (question.type) {
                                                case 0:
                                                    return "";
                                                case 1:
                                                    return 0;
                                                case 2:
                                                    return "";
                                            }
                                            return undefined
                                        };

                                        return (<Question
                                            key={idx}
                                            question={question}
                                            updateResponse={updateFormResponse}
                                            deleteResponseKey={deleteResponseKey}
                                            disable={processingForm}
                                            startingValue={startingValue()}
                                        />)
                                    })
                                    :
                                    null
                                }

                                <Stack spacing={2} direction="row-reverse">
                                    {!processingForm ?
                                        <Button
                                            variant="contained"
                                            color="primary"
                                            endIcon={<SendIcon />}
                                            onClick={submitResponse}
                                            disabled={processingForm}
                                        >
                                            Submit
                                        </Button>
                                        :
                                        <CircularProgress size={24} />
                                    }
                                    {/* <Button variant="text" color="inherit" disabled={processingForm}>Save as Draft</Button>
                                    <Button variant="text" color="error" endIcon={<FlagIcon />}>Report Form</Button> */}
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
                                    <Button variant="text" color="primary" onClick={(_) => { window.location.href = "/" }}>Go Home</Button>
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
