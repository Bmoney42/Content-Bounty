import React, { useState } from 'react'
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Download, 
  ExternalLink, 
  FileText,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as AudioIcon,
  File as FileIcon,
  X,
  Maximize,
  Minimize
} from 'lucide-react'
import { ContentFile } from '../../services/fileUpload'
import { FileUploadService } from '../../services/fileUpload'

interface ContentPreviewProps {
  files: ContentFile[]
  onRemoveFile?: (fileId: string) => void
  showRemoveButton?: boolean
  maxPreviewSize?: number
  className?: string
}

const ContentPreview: React.FC<ContentPreviewProps> = ({
  files,
  onRemoveFile,
  showRemoveButton = false,
  maxPreviewSize = 300,
  className = ''
}) => {
  const [fullscreenFile, setFullscreenFile] = useState<ContentFile | null>(null)
  const [videoStates, setVideoStates] = useState<Record<string, { playing: boolean; muted: boolean }>>({})

  const handleVideoToggle = (fileId: string) => {
    setVideoStates(prev => ({
      ...prev,
      [fileId]: {
        playing: !prev[fileId]?.playing,
        muted: prev[fileId]?.muted || false
      }
    }))
  }

  const handleVideoMute = (fileId: string) => {
    setVideoStates(prev => ({
      ...prev,
      [fileId]: {
        playing: prev[fileId]?.playing || false,
        muted: !prev[fileId]?.muted
      }
    }))
  }

  const getFileIcon = (fileType: string) => {
    if (FileUploadService.isImage(fileType)) return <ImageIcon className="w-5 h-5" />
    if (FileUploadService.isVideo(fileType)) return <VideoIcon className="w-5 h-5" />
    if (FileUploadService.isAudio(fileType)) return <AudioIcon className="w-5 h-5" />
    if (FileUploadService.isDocument(fileType)) return <FileText className="w-5 h-5" />
    return <FileIcon className="w-5 h-5" />
  }

  const renderFilePreview = (file: ContentFile) => {
    const isImage = FileUploadService.isImage(file.fileType)
    const isVideo = FileUploadService.isVideo(file.fileType)
    const isAudio = FileUploadService.isAudio(file.fileType)
    const isDocument = FileUploadService.isDocument(file.fileType)

    if (isImage) {
      return (
        <div className="relative group">
          <img
            src={file.url}
            alt={file.fileName}
            className="w-full h-full object-cover rounded-lg cursor-pointer"
            onClick={() => setFullscreenFile(file)}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center">
            <Maximize className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
          </div>
        </div>
      )
    }

    if (isVideo) {
      const videoState = videoStates[file.id] || { playing: false, muted: true }
      
      return (
        <div className="relative group">
          <video
            src={file.url}
            className="w-full h-full object-cover rounded-lg"
            muted={videoState.muted}
            loop
            onPlay={() => setVideoStates(prev => ({ ...prev, [file.id]: { ...prev[file.id], playing: true } }))}
            onPause={() => setVideoStates(prev => ({ ...prev, [file.id]: { ...prev[file.id], playing: false } }))}
          />
          <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 rounded-lg flex items-center justify-center gap-2">
            <button
              onClick={() => handleVideoToggle(file.id)}
              className="p-2 bg-black bg-opacity-50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              {videoState.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleVideoMute(file.id)}
              className="p-2 bg-black bg-opacity-50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              {videoState.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <button
              onClick={() => setFullscreenFile(file)}
              className="p-2 bg-black bg-opacity-50 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      )
    }

    if (isAudio) {
      const audioState = videoStates[file.id] || { playing: false, muted: false }
      
      return (
        <div className="relative group">
          <audio
            src={file.url}
            className="w-full"
            muted={audioState.muted}
            onPlay={() => setVideoStates(prev => ({ ...prev, [file.id]: { ...prev[file.id], playing: true } }))}
            onPause={() => setVideoStates(prev => ({ ...prev, [file.id]: { ...prev[file.id], playing: false } }))}
          />
          <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center gap-2">
            <button
              onClick={() => handleVideoToggle(file.id)}
              className="p-2 bg-blue-500 rounded-full text-white"
            >
              {audioState.playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              onClick={() => handleVideoMute(file.id)}
              className="p-2 bg-gray-500 rounded-full text-white"
            >
              {audioState.muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="text-sm text-gray-600">{file.fileName}</span>
          </div>
        </div>
      )
    }

    if (isDocument) {
      return (
        <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
          <div className="text-center">
            <FileText className="w-8 h-8 text-gray-500 mx-auto mb-2" />
            <p className="text-sm text-gray-600 font-medium">{file.fileName}</p>
            <p className="text-xs text-gray-500">{FileUploadService.formatFileSize(file.fileSize)}</p>
          </div>
        </div>
      )
    }

    return (
      <div className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
        <div className="text-center">
          <FileIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
          <p className="text-sm text-gray-600 font-medium">{file.fileName}</p>
          <p className="text-xs text-gray-500">{FileUploadService.formatFileSize(file.fileSize)}</p>
        </div>
      </div>
    )
  }

  const renderFileCard = (file: ContentFile) => (
    <div key={file.id} className="relative group">
      <div 
        className="relative overflow-hidden rounded-lg border border-gray-200 hover:border-gray-300 transition-colors duration-200"
        style={{ height: maxPreviewSize }}
      >
        {renderFilePreview(file)}
        
        {/* File info overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
          <div className="flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              {getFileIcon(file.fileType)}
              <span className="text-sm font-medium truncate">{file.fileName}</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-xs">{FileUploadService.formatFileSize(file.fileSize)}</span>
              <a
                href={file.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={file.url}
                download={file.fileName}
                className="p-1 hover:bg-white/20 rounded transition-colors"
              >
                <Download className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>

        {/* Remove button */}
        {showRemoveButton && onRemoveFile && (
          <button
            onClick={() => onRemoveFile(file.id)}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          >
            <X className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  )

  return (
    <>
      <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 ${className}`}>
        {files.map(renderFileCard)}
      </div>

      {/* Fullscreen modal */}
      {fullscreenFile && (
        <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setFullscreenFile(null)}
              className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 text-white rounded-full hover:bg-opacity-70 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <div className="max-w-full max-h-full overflow-auto">
              {FileUploadService.isImage(fullscreenFile.fileType) && (
                <img
                  src={fullscreenFile.url}
                  alt={fullscreenFile.fileName}
                  className="max-w-full max-h-full object-contain"
                />
              )}
              
              {FileUploadService.isVideo(fullscreenFile.fileType) && (
                <video
                  src={fullscreenFile.url}
                  controls
                  className="max-w-full max-h-full"
                  autoPlay
                />
              )}
              
              {FileUploadService.isAudio(fullscreenFile.fileType) && (
                <div className="bg-white rounded-lg p-8 text-center">
                  <AudioIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <audio
                    src={fullscreenFile.url}
                    controls
                    className="w-full"
                    autoPlay
                  />
                  <p className="mt-4 text-lg font-medium">{fullscreenFile.fileName}</p>
                </div>
              )}
              
              {FileUploadService.isDocument(fullscreenFile.fileType) && (
                <div className="bg-white rounded-lg p-8 text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">{fullscreenFile.fileName}</p>
                  <p className="text-gray-600 mb-4">{FileUploadService.formatFileSize(fullscreenFile.fileSize)}</p>
                  <a
                    href={fullscreenFile.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Open Document
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default ContentPreview
