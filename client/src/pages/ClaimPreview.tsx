import { useParams, useNavigate } from 'react-router-dom'
import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
export default function ClaimPreview() {
  const { tmdbPersonId } = useParams()
  const navigate = useNavigate()
  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Icon name="preview" className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-2xl font-bold">Preview Profile {tmdbPersonId}</h1>
          <p className="text-on-surface-variant mt-2">Review the profile before claiming.</p>
          <Button onClick={() => navigate('/creator/claim/verify')} className="mt-6">Continue</Button>
        </div>
      </div>
    </Layout>
  )
}
