import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
export default function ClaimStatus() {
  const { claimId } = useParams()
  const navigate = useNavigate()
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-xl">
          <Icon name="hourglass_empty" className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold">Claim Status</h1>
          <p className="text-on-surface-variant mt-2">Claim {claimId} is being verified. You will be redirected shortly.</p>
          <Button onClick={() => navigate('/creator/claim/start')} className="mt-6">Back to Claims</Button>
        </div>
      </div>
    </Layout>
  )
}
