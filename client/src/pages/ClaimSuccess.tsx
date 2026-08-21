import { useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
export default function ClaimSuccess() {
  const navigate = useNavigate()
  return (
    <Layout>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <div className="text-center max-w-xl">
          <Icon name="check_circle" className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-2xl font-bold">Claim Successful</h1>
          <p className="text-on-surface-variant mt-2">Your creator profile has been claimed.</p>
          <Button onClick={() => navigate('/creator/onboarding')} className="mt-6">Continue to Onboarding</Button>
        </div>
      </div>
    </Layout>
  )
}
