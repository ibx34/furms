import { Divider, Grid, Paper, Stack, TextField, Typography, Switch, FormControlLabel, Button, Alert, AlertTitle } from '@mui/material'
import type { NextPage } from 'next'
import { useState } from 'react';
import axios from 'axios';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

const NewForm: NextPage = () => {
    const [usingPassword, setUsingPassword] = useState<boolean>(false);
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
                    code: 3,
                    message: "Form password must be above 0 characters if set."
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
            {withCredentials: false, method:"post",url:`http://localhost:8080/forms/new`,
                data: {
                    "name": formName,
                    "description": formDescription,
                    "password": formPassword
                }
            }
        ).then((response) => {
            console.log(response.data)
            window.location.href = `/forms/${response.data.form_id}/questions`
        }).catch((error) => {});
        setCreatingForm(false);
    }

    return (
        <Grid container spacing={5} columns={24} direction="row" paddingTop={5}>
            <Grid item xs />
            <Grid item xs={12}>
                <Stack spacing={4}>
                    { formErrors.length > 0 ?
                        <Alert severity='error'>
                            <AlertTitle>There were some problems with the form you tried to create.</AlertTitle>
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

                                <Stack spacing={1}>
                                        <FormControlLabel 
                                            control={
                                                <Switch 
                                                    value={usingPassword} 
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
                                    </Stack>
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
    )
}

export default NewForm
