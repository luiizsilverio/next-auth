import { GetServerSideProps } from "next"
import { FormEvent, useContext, useState } from "react"
import { parseCookies } from 'nookies'

import styles from '../styles/Home.module.css'
import { AuthContext } from "../contexts/AuthContext"
import { SSRGuest } from "../utils/SSRGuest"

export default function Home() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const { signIn } = useContext(AuthContext)
  
  async function handleSubmit(event: FormEvent) {
    event.preventDefault()

    const data = {
      email,
      password
    }
    await signIn(data)
  }

  return (
    <form onSubmit={handleSubmit} className={styles.container}>
      <input type="email" 
        value={email} 
        placeholder='diego@rocketseat.team'
        onChange={ev => setEmail(ev.target.value)}
      />
      <input type="password"
        value={password} 
        onChange={ev => setPassword(ev.target.value)}
      />
      <button type="submit">Entrar</button>
    </form>
  )
}

export const getServerSideProps = SSRGuest(async(ctx) => {
  return {
    props: {} // não envia nada
  }
})

/* agora, chama a função SSRGuest
export const getServerSideProps: GetServerSideProps = async(ctx) => {
  const cookies = parseCookies(ctx) 
  //console.log(ctx.req.cookies)
  
  // se não existir o cookie, redireciona p/ o dashboard
  if (cookies['nextauth.token']) {
    return {
      redirect: {
        destination: '/dashboard',
        permanent: false
      }
    }
  }
  
  return {
    props: {} // não envia nada
  }
}
*/
