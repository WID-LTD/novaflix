import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
export default function CreatorPPMSettings() {
  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-12">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Icon name="payments" /> PPM Settings</h1>
          <p className="text-on-surface-variant mt-2">Configure your per-minute pricing.</p>
        </div>
      </div>
    </Layout>
  )
}
