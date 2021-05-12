import { destroyCookie } from "nookies"
import { useContext, useEffect } from "react"

import { AuthContext, signOut } from "../contexts/AuthContext"
import { useCan } from "../hooks/useCan"
import { setupAPIClient } from "../services/api"
import { api } from "../services/apiClient"
import { SSRAuth } from "../utils/SSRAuth"
import { Can } from '../components/Can'

export default function Dashboard() {
    const { user, signOut, isAuthenticated } = useContext(AuthContext)

    // administrator ou editor com permissão de metrics.list
    const userCanSeeMetrics = useCan({
        permissions: ['metrics.list'],
        roles: ['administrator', 'editor']
    })

    useEffect(() => {
        api.get('/me')
            .then(response => {}) //console.log)
            .catch(err => console.error)
    }, [])
    
    return (
        <>
            <h1>Dashboard</h1>
            <p>{ user?.email }</p>

            <p>{ isAuthenticated && 'autenticado' }</p>

            <button onClick={signOut}>Signout</button>
            <Can 
                permissions={['metrics.list']}
                roles={['administrator', 'editor']}
            >
                <p>Métricas</p>
            </Can>
        </>
    )
}

export const getServerSideProps = SSRAuth(async (ctx) => {
    const apiClient = setupAPIClient(ctx)
    const response = await apiClient.get('/me')
    
    return {
        props: {}
    }
})
