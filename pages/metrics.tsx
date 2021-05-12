import decode from 'jwt-decode'
import { setupAPIClient } from "../services/api"
import { SSRAuth } from "../utils/SSRAuth"

export default function Metrics() {

    return (
        <>
            <h1>Metrics</h1>            
        </>
    )
}

export const getServerSideProps = SSRAuth(async (ctx) => {
    const apiClient = setupAPIClient(ctx)
    const response = await apiClient.get('/me')
    
    return {
        props: {}
    }
}, {
    permissions: ['metrics.list'],
    roles: ['administrator']
})
