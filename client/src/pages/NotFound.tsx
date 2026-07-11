import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center">
        <div className="text-[120px] md:text-[180px] font-bold leading-none mb-4">
          <span className="text-accent">4</span>
          <span className="text-gray-600">0</span>
          <span className="text-accent">4</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-3">Page Not Found</h1>
        <p className="text-gray-400 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button size="lg">
            <Home className="w-5 h-5" /> Go Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
