import Icon from '../components/ui/Icon'

export default function CreatorProfileHub() {
  return (
    <div className="min-h-screen px-margin-mobile md:px-margin-desktop pt-6 md:pt-10 pb-nav">
      <div className="max-w-4xl mx-auto text-center py-20">
        <Icon name="person" className="w-16 h-16 text-on-surface-variant/40 mx-auto mb-4" />
        <h1 className="text-headline-md font-bold mb-2">Creator Profile</h1>
        <p className="text-on-surface-variant">Manage your creator profile and branding</p>
      </div>
    </div>
  )
}
