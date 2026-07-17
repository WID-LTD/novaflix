import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { getDownloadedFiles, deleteDownloadedFile } from '../lib/auth'
import Button from '../components/ui/Button'
import Icon from '../components/ui/Icon'
import Skeleton from '../components/ui/Skeleton'

interface DownloadFile {
  name: string
  size: number
  sizeLabel: string
  createdAt: string
  modifiedAt: string
}

export default function Downloads() {
  const [files, setFiles] = useState<DownloadFile[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)

  useEffect(() => {
    getDownloadedFiles().then(res => {
      if (res.success) setFiles(res.files)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleDelete = async (name: string) => {
    const res = await deleteDownloadedFile(name)
    if (res.success) {
      setFiles(prev => prev.filter(f => f.name !== name))
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className="min-h-screen">
      <div className="bg-surface-container border-b border-white/5">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <Icon name="download" className="text-3xl text-primary-container" />
            <h1 className="text-headline-md font-bold">Downloads</h1>
          </div>
          <p className="text-on-surface-variant text-sm">
            {files.length} file{files.length !== 1 ? 's' : ''} downloaded
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} variant="text" className="w-full h-20 rounded-xl" />
            ))}
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="download" className="text-5xl text-on-surface-variant/30 mx-auto mb-4" />
            <h2 className="text-headline-sm font-bold mb-2">No downloads yet</h2>
            <p className="text-on-surface-variant mb-6">Download movies and shows from the watch page to access them offline.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file, i) => (
              <motion.div
                key={file.name}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-surface-container-high rounded-xl border border-white/5 overflow-hidden"
              >
                <div className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-container/10 flex items-center justify-center shrink-0">
                    <Icon name="video_file" className="text-primary-container text-2xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-label-md text-label-md truncate">{file.name}</p>
                    <div className="flex items-center gap-3 text-xs text-on-surface-variant/60 mt-1">
                      <span>{file.sizeLabel}</span>
                      <span>{formatDate(file.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {selectedFile === file.name ? (
                      <video
                        src={`/api/file/${encodeURIComponent(file.name)}`}
                        controls
                        className="max-w-xs max-h-48 rounded-lg"
                        autoPlay
                      />
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedFile(file.name)}
                        >
                          <Icon name="play_arrow" /> Play
                        </Button>
                        <button
                          onClick={() => handleDelete(file.name)}
                          className="p-2 rounded-lg hover:bg-white/5 text-on-surface-variant hover:text-red-400 transition-colors"
                        >
                          <Icon name="delete" size="sm" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                {selectedFile === file.name && (
                  <div className="px-4 pb-4">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedFile(null)}>
                      <Icon name="close" size="sm" /> Close
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
