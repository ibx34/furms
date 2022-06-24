import { Box, Button } from '@mui/material'
import type { GetServerSideProps, NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import cookie from "cookie";
import DrawerNav from '../components/DrawerNav'

const Home = ({session}: {session: null | string}) => {
  return (
    <Box sx={{ display: 'flex' }}>
        <DrawerNav session={session} form={null} setCurrentPage={(_) => {}}/>
        <Box
          component="main"
          sx={{ flexGrow: 1, bgcolor: 'background.default', p: 3 }}
        >
        owo
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


export default Home
