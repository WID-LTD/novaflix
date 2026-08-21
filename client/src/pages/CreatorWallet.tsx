import Layout from '../components/layout/Layout'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'
import { Link } from 'react-router-dom'
export default function CreatorWallet() {
  return (
    <Layout>
      <div className="min-h-screen px-4 md:px-8 py-12">
        <div className="max-w-3xl mx-auto text-center">
          <Icon name="account_balance_wallet" className="w-16 h-16 mx-auto mb-4 text-primary" />
          <h1 className="text-3xl font-bold">Creator Wallet</h1>
          <p className="text-on-surface-variant mt-2">Manage earnings and payouts.</p>
          <Link to="/creator/dashboard"><Button className="mt-6">Back to Dashboard</Button></Link>
        </div>
      </div>
    </Layout>
  )
}
