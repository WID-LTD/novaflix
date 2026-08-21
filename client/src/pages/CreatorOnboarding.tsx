import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Link } from 'react-router-dom'
export default function CreatorOnboarding() {
  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Icon name="rocket_launch" className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold">Creator Onboarding</h1>
          <p className="text-on-surface-variant mt-2">Set up your creator profile and start uploading.</p>
          <div className="mt-8 flex gap-4 justify-center">
            <Link to="/creator/dashboard"><Button>Go to Dashboard</Button></Link>
            <Link to="/upload"><Button variant="secondary">Upload Film</Button></Link>
          </div>
        </div>
      </div>
    </Layout>
  )
}
