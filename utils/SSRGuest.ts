import { GetServerSideProps, GetServerSidePropsContext } from "next"
import { parseCookies } from "nookies"

// Validando o visitante
export function SSRGuest(fn: GetServerSideProps) {
    return async (ctx: GetServerSidePropsContext) => {
        const cookies = parseCookies(ctx) 
        //console.log(ctx.req.cookies)
        
        // Se existir o token, redireciona p/ o dashboard
        if (cookies['nextauth.token']) {
          return {
            redirect: {
              destination: '/dashboard',
              permanent: false
            }
          }
        }     

        return await fn(ctx)        
    }
}

// Esse redirecionamento está sendo feito do lado do servidor.
// Poderia ser feito do lado do cliente, ou seja, dentro do useEffect 
// do componente, mas iria mostrar a página e redirecionar em seguida.
