import { createContext, ReactNode, useEffect, useState } from "react";
import Router from 'next/router'
import { setCookie, parseCookies, destroyCookie } from 'nookies'
import { api } from "../services/apiClient";

type SignInCredentials = {
    email: string       // diego@rocketseat.team
    password: string    // 123456
}

type AuthContextData = {
    user: User
    signIn: (credentials: SignInCredentials) => Promise<void>
    signOut: () => void
    isAuthenticated: boolean        
}

type AuthProviderProps = {
    children: ReactNode
}

type User = {
    email: string
    permissions: string[]
    roles: string[]
}

export const AuthContext = createContext({} as AuthContextData)

let authChannel: BroadcastChannel

export function signOut() {
    destroyCookie(undefined, 'nextauth.token')
    destroyCookie(undefined, 'nextauth.refreshToken')
    
    authChannel.postMessage('signOut') // envia uma mensagem 
    Router.push('/')
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User>(null)
    const isAuthenticated = !!user

    useEffect(() => {
        // BroadcastChannel permite comunicação entre as abas do browser
        // Por ex, se a aplicação estiver aberta em 2 ou mais abas,
        // se eu fizer logout em uma delas, com o BroadcastChannel 
        // eu consigo deslogar todas elas automaticamente.

        authChannel = new BroadcastChannel('auth')

        // onMessage fica ouvindo se tem mensagem
        authChannel.onmessage = (message) => {
            if (message.data === 'signOut') {
                signOut()
            }
        }
    }, [])

    useEffect(() => {
        // retorna uma lista com todos os cookies
        const { 'nextauth.token': token } = parseCookies() 

        if (token) {
            api.get('/me').then(response => {
                const { email, permissions, roles } = response.data

                setUser({ email, permissions, roles })
            })
            .catch(error => {
                signOut()
            })
        }
    }, []) // somente uma vez

    async function signIn({ email, password }: SignInCredentials) {
        try {
            const response = await api.post('sessions', {
                email,
                password,
            })
            
            const { token, refreshToken, permissions, roles } = response.data

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 7, // tempo de vida: 7 dias
                path: '/'
            })

            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 7, // tempo de vida: 7 dias
                path: '/'            
            })

            setUser({
                email, 
                permissions,
                roles,
            })

            api.defaults.headers['Authorization'] = `Bearer ${token}`

            Router.push('/dashboard')  //direciona p/ o dashboard
            
        } catch(err) {
            console.error(err)
        }
    }

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, isAuthenticated }}>
            {children}
        </AuthContext.Provider>
    )
}
