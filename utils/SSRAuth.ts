import { GetServerSideProps, GetServerSidePropsContext } from "next"
import { destroyCookie, parseCookies } from "nookies"
import decode from 'jwt-decode'
import { AuthTokenError } from "../services/AuthTokenError"
import { validateUserPermissions } from "./validateUserPermissions"

type SSRAuthOptions = {
  permissions?: string[]
  roles?: string[]
}

// Validando a autenticação
export function SSRAuth(fn: GetServerSideProps, options?: SSRAuthOptions) {
    return async (ctx: GetServerSidePropsContext) => {
        const cookies = parseCookies(ctx) 
        const token = cookies['nextauth.token']
        
        // Se NÃO existir o token, redireciona p/ o login
        if (!token) {
          return {
            redirect: {
              destination: '/',
              permanent: false
            }
          }
        }     

      if (options) {
        const user = decode<{ permissions: string[], roles: string[] }>(token)
        const { permissions, roles } = options
        
        const validPermissions = validateUserPermissions({
          user,
          permissions,
          roles
        })
        
        if (!validPermissions) {
          return {
            redirect: {
              destination: '/dashboard',
              permanent: false,
            }
          }
        }
      }

      try {
        return await fn(ctx)      
      } catch (err) {
          if (err instanceof AuthTokenError) {            
            destroyCookie(ctx, 'nextauth.token')
            destroyCookie(ctx, 'nextauth.refreshToken')
            
            // aqui é servidor, não funciona o router.push
            // por isso não chamei a função signOut()
            
            return {
              redirect: {
                destination: '/',
                permanent: false,
              }
            }        
          }
      }
    }
}

// Esse redirecionamento está sendo feito do lado do servidor.
// Poderia ser feito do lado do cliente, ou seja, dentro do useEffect 
// do componente, mas iria mostrar a página e redirecionar em seguida.
