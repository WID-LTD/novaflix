import { useState } from 'react'
import Icon from '../../ui/Icon'

interface NewsImageProps {
  src: string | null
  alt: string
  className?: string
  iconClassName?: string
}

export default function NewsImage({ src, alt, className = '', iconClassName = 'text-4xl' }: NewsImageProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return (
      <div className={`${className} bg-surface-container flex items-center justify-center text-on-surface-variant/30`}>
        <Icon name="newspaper" className={iconClassName} />
      </div>
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setError(true)}
      className={className}
    />
  )
}
