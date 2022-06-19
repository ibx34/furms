import { Button } from '@mui/material'
import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'

const Home: NextPage = () => {
  return (
    <div className={styles.container}>
      <Button variant="contained" color="success" onClick={(_)=>window.location.href="http://localhost:3001/api/oauth2/login?service=discord"}>
        Login
      </Button>
    </div>
  )
}

export default Home
