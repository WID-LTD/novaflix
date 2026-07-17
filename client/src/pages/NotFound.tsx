import { Link } from 'react-router-dom'
import Icon from '../components/ui/Icon'
import Button from '../components/ui/Button'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-4">
      <div className="text-center">
        <div className="text-[120px] md:text-[180px] font-bold leading-none mb-4">
          <span className="text-primary-container">4</span>
          <span className="text-on-surface-variant/40">0</span>
          <span className="text-primary-container">4</span>
        </div>
        <h1 className="text-headline-lg mb-3">Page Not Found</h1>
        <p className="text-on-surface-variant mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button size="lg">
            <Icon name="home" /> Go Home
          </Button>
        </Link>
      </div>
    </div>
  )
}
