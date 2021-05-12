import axios, { AxiosError } from 'axios'
import Router from 'next/router'
import { destroyCookie, parseCookies, setCookie } from 'nookies'
import { AuthTokenError } from './AuthTokenError'

let isRefreshing = false
let failRequestsQueue = []

export function setupAPIClient(ctx = undefined) {
    let cookies = parseCookies(ctx) // executa somente a 1.a vez

    const api = axios.create({
        baseURL: 'http://localhost:3333',
        headers: {
            Authorization: `Bearer ${cookies['nextauth.token']}`
        }
    })

    // interceptors: permite interceptar requisições e respostas
    // 1.o parâmetro: função para o caso de sucesso
    // 2.o parâmetro: função para o caso de falha
    // executa a cada requisição / resposta

    api.interceptors.response.use(
        response => {
            return response // sucesso? não faz nada
        }, 
        (error: AxiosError) => {
            if (error.response.status === 401) {
                if (error.response.data?.code === 'token.expired') {
                    // Se o token expirou, renovar o token (refresh token)
                    cookies = parseCookies(ctx)

                    const { 'nextauth.refreshToken': refreshToken } = cookies
                    const originalConfig = error.config

                    if (!isRefreshing) {
                        isRefreshing = true

                        api.post('/refresh', { refreshToken })
                            .then(response => {
                                const newToken = response.data.token
                                const newRefreshToken = response.data.refreshToken

                                setCookie(ctx, 'nextauth.token', newToken, {
                                    maxAge: 60 * 60 * 24 * 7, // tempo de vida: 7 dias
                                    path: '/'
                                })
                        
                                setCookie(ctx, 'nextauth.refreshToken', newRefreshToken, {
                                    maxAge: 60 * 60 * 24 * 7, // tempo de vida: 7 dias
                                    path: '/'            
                                })

                                api.defaults.headers['Authorization'] = `Bearer ${newToken}`

                                failRequestsQueue.forEach(request => request.onSuccess(newToken))
                                failRequestsQueue = []

                            }).catch(err => {
                                failRequestsQueue.forEach(request => request.onFailure(err))
                                failRequestsQueue = []
                                
                            }).finally(() => {
                                isRefreshing = false
                            })
                    }

                    return new Promise((resolve, reject) => {
                        failRequestsQueue.push({
                            onSuccess: (token: string) => {
                                originalConfig.headers['Authorization'] = `Bearer ${token}`
                                resolve(api(originalConfig)) //chama a API de novo
                            },
                            onFailure: (err: AxiosError) => {
                                reject(err)
                            }
                        })
                    })          

                } else {
                    // Deu outro erro? Deslogar o usuário
                    if (process.browser) {  //chamada pelo lado cliente?
                        destroyCookie(ctx, 'nextauth.token')
                        destroyCookie(ctx, 'nextauth.refreshToken')
                        Router.push('/') // Router.push só funciona do lado do cliente
                    } else {
                        return Promise.reject(new AuthTokenError())
                    }
                }
            }       
            
            return Promise.reject(error)
        })

    return api
}
