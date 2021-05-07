import axios, { AxiosError } from 'axios'
import { parseCookies, setCookie } from 'nookies'

let cookies = parseCookies() // executa somente a 1.a vez
let isRefreshing = false
let failRequestsQueue = []

export const api = axios.create({
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
                cookies = parseCookies()

                const { 'nextauth.refreshToken': refreshToken } = cookies
                const originalConfig = error.config

                if (!isRefreshing) {
                    isRefreshing = true

                    api.post('/refresh', { refreshToken })
                        .then(response => {
                            const newToken = response.data.token
                            const newRefreshToken = response.data.refreshToken

                            setCookie(undefined, 'nextauth.token', newToken, {
                                maxAge: 60 * 60 * 24 * 7, // tempo de vida: 7 dias
                                path: '/'
                            })
                    
                            setCookie(undefined, 'nextauth.refreshToken', newRefreshToken, {
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

            }
        }        
    }
)
