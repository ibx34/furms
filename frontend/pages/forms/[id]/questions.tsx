import { Alert, AlertTitle, Button, Chip, Divider, Grid, Paper, Stack, TextField, Typography } from '@mui/material'
import axios from 'axios'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import PasswordRequired from '../../../components/PasswordRequired'
import Question from '../../../components/Question'
import EditQuestion from '../../../components/EditQuestion'
import SendIcon from '@mui/icons-material/Send';
import { red } from '@mui/material/colors'
import { CircularProgress } from '@mui/material';
import { QuestionType, FormType } from "../../../types/types";

const UpdateFormQuestions: NextPage = () => {
    const { isReady, query } = useRouter();
    const [ formRequiresPassword, setFormRequiresPassword] = useState<boolean>(false);
    const [ formSubmitted, setFormSubmitted] = useState<boolean>(false);
    const [ processingForm, setProcessingForm] = useState<boolean>(false);
    const [ providedFormPassword, setProvidedFormPassword] = useState<string>("");
    const [ formLoaded, setFormLoaded] = useState<boolean>(false);
    const [ savingQuestions, setSavingQuestions] = useState<boolean>(false);
    const [ newQuestions, setNewQuestions] = useState<QuestionType[]>([]);
    const [ form, setForm] = useState<FormType>();
    const [formErrors, setFormErrors] = useState<{
        code: number,
        message: string
    }[]>([]);

    useEffect(() => {		
        if (isReady && !formLoaded) {
            axios.request(
                {withCredentials: false, method:"get",url:`http://localhost:3001/api/forms/${query.id}`}
            ).then((response) => {
                setForm(response.data);
                if (response.data.questions != null) {
                    setNewQuestions(response.data.questions)
                }
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
    }, [isReady, formLoaded, query.id])

    const loadQuestions = () => {
        return newQuestions
    }

    const calculateNextId = (): number => {
        let questions = loadQuestions();

        if (form) {
            if (form.questions && form.questions.length <= 0 && newQuestions.length <= 0) {
                return 0;
            } 
            else if (form.questions || newQuestions.length > 0) {
                let ids =questions.map((q) => q.id);
                let highest_id = Math.max(...ids);
                return highest_id + 1;   
            } else if (form.questions == null && newQuestions.length <= 0) {
                return 0;
            }
        }
        return -1;
    }

    const addNewQuestion = () => {
        if (query.id && form) {
            let next_id = calculateNextId();
            if (next_id == -1) {
                console.log("oop");
                return;
            }

            let question: QuestionType = {
                name: "",
                form_id: Number(query.id),
                id: next_id,
                type: 0,
                description: "",
                min: null,
                max: null,
                choices: null
            };
    
            setNewQuestions([...newQuestions, question]);
        }
    }

    const saveQuestions = () => {
        axios.request(
            {withCredentials: false, method:"patch",url:`http://localhost:3001/api/forms/${query.id}/questions`,data: {
                "questions": newQuestions
            }}
        ).then((response) => {
            setSavingQuestions(false);
        }).catch((error) => {
            if (error.response.status) {
                switch (error.response.status) {
                    case 401:
                        setFormRequiresPassword(true);
                        break;
                }
            }
        });
        setSavingQuestions(true);
    }

    const updateQuestions = (index: number, question: any) => {
        newQuestions[index] = question;
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
                                url:`http://localhost:3001/api/forms/${query.id}`,
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


            <Grid container spacing={5} columns={24} direction="row" paddingTop={5}>
                <Grid item xs />
                    <Grid item xs={12}>
                        <Stack spacing={4}>
                            <Paper variant="outlined">
                                <Stack spacing={4} padding={3}>
                                    <Typography variant="h4" component="div">
                                        Update questions
                                    </Typography>

                                    { !savingQuestions ?
                                        <Button 
                                            variant="outlined" 
                                            color="primary" 
                                            onClick={saveQuestions} 
                                            disabled={savingQuestions}
                                        >
                                            Save Questions
                                        </Button>
                                        :
                                        <CircularProgress size={24} /> 
                                    }
                                </Stack>
                            </Paper>

                            { form ? 
                                    <Stack spacing={4}>
                                        <Divider>
                                            <Button 
                                                variant="text" 
                                                color="primary"
                                                onClick={addNewQuestion}
                                            >
                                                Add Question
                                            </Button>
                                        </Divider>

                                        { loadQuestions() != null ?
                                            <>{loadQuestions().map((question: QuestionType, index: number) => (
                                                <EditQuestion key={index} question={newQuestions[index]} index={index} disable={false} updateQuestion={updateQuestions}/>
                                            ))}</>
                                            :
                                            null

                                        }
                                    </Stack>
                                :
                                null
                            }
                        </Stack>
                    </Grid>
                <Grid item xs />
            </Grid>
        </div>
    )
}

export default UpdateFormQuestions
