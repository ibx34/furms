import { Box, Button, Paper, Stack, Typography, IconButton, Tooltip } from '@mui/material'
import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import cookie from "cookie";
import DrawerNav from '../../components/DrawerNav'
import { FormType } from '../../types/types'
import { useEffect, useState } from 'react'
import Router, { useRouter } from 'next/router'
import axios from 'axios'
import SettingsIcon from '@mui/icons-material/Settings';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveRedEyeIcon from '@mui/icons-material/RemoveRedEye';

const MyForms = ({session}: {session: null | string}) => {
    const { isReady, query } = useRouter();
    const [forms, SetForms] = useState<FormType[]>([]);
    const [formsLoaded, SetFormsLoaded] = useState<boolean>(false);

    useEffect(() => {
        if (isReady && !formsLoaded) {
            axios.request(
                { withCredentials: false, method: "get", url: `${process.env.NEXT_PUBLIC_API_BASE}/api/@me/forms` }
            ).then((response) => {
                SetForms(response.data)
            }).catch((error) => {});
            SetFormsLoaded(true);
        }
    }, [])

    return (
        <Box sx={{ display: 'flex' }}>
            <DrawerNav session={session} form={null} setCurrentPage={(_) => {}}/>
            <Box
                component="main"
                sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
            >
                { forms !== null ? 
                    <Stack spacing={2} direction={"column"}>
                        {forms.map((form,idx) => (
                            <Paper variant={"outlined"} key={idx}>
                                <Stack spacing={2} padding={2} direction="row">
                                    <Typography variant="h6">{form.name}</Typography>
                                    <div>
                                        <Tooltip title="Manage this form">
                                            <IconButton onClick={(_) => Router.push(`/forms/${form.form_id}/manage`)}>
                                                <SettingsIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="View this form">
                                            <IconButton onClick={(_) => Router.push(`/forms/${form.form_id}`)}>
                                                <RemoveRedEyeIcon />
                                            </IconButton>
                                        </Tooltip>
                                        <Tooltip title="Delete this form">
                                            <IconButton color="error" onClick={(_) => Router.push(`/forms/${form.form_id}/manage`)}>
                                                <DeleteIcon />
                                            </IconButton>
                                        </Tooltip>
                                    </div>
                                </Stack>
                            </Paper>
                        ))}
                    </Stack>
                    :
                    null
                }
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

export default MyForms
