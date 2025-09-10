import React, { useState, useRef, useCallback } from 'react'
import { 
  Upload, 
  X, 
  File, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Image as ImageIcon,
  Video as VideoIcon,
  Music as AudioIcon,
  FileText as DocumentIcon
} from 'lucide-react'
import { FileUploadService, ContentFile, FileUploadResult, UploadProgressCallback } from '../../services/fileUpload'

interface FileUploadProps {
  onFilesUploaded: (files: ContentFile[]) => void
  onFilesRemoved?: (fileIds: string[]) => void
  maxFiles?: number
  maxFileSize?: number
  allowedTypes?: string[]
  uploadPath?: string
  className?: string
  disabled?: boolean
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFilesUploaded,
  onFilesRemoved,
  maxFiles = 10,
  maxFileSize = 100 * 1024 * 1024, // 100MB
  allowedTypes,
  uploadPath = 'content',
  className = '',
  disabled = false
}) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>({})
  const [uploadErrors, setUploadErrors] = useState<Record<string, string>>({})
  const [uploadedFiles, setUploadedFiles] = useState<ContentFile[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFiles = useCallback(async (files: File[]) => {
    if (files.length === 0) return

    // Check file count limit
    if (uploadedFiles.length + files.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`)
      return
    }

    setUploading(true)
    setUploadErrors({})

    try {
      // Validate files
      const validFiles: File[] = []
      const errors: Record<string, string> = {}

      for (const file of files) {
        const validation = FileUploadService.validateFile(file)
        
        if (!validation.isValid) {
          errors[file.name] = validation.errors.join(', ')
          continue
        }

        // Check custom restrictions
        if (maxFileSize && file.size > maxFileSize) {
          errors[file.name] = `File size exceeds ${FileUploadService.formatFileSize(maxFileSize)}`
          continue
        }

        if (allowedTypes && !allowedTypes.includes(file.type)) {
          errors[file.name] = `File type ${file.type} is not allowed`
          continue
        }

        validFiles.push(file)
      }

      if (Object.keys(errors).length > 0) {
        setUploadErrors(errors)
        console.error('File validation errors:', errors)
      }

      if (validFiles.length === 0) {
        setUploading(false)
        return
      }

      // Upload files
      const progressCallback: UploadProgressCallback = (progress, fileName) => {
        setUploadProgress(prev => ({
          ...prev,
          [fileName]: progress
        }))
      }

      const uploadResults = await FileUploadService.uploadMultipleFiles(
        validFiles,
        uploadPath,
        progressCallback
      )

      // Convert to ContentFile format
      const newContentFiles: ContentFile[] = uploadResults.map((result, index) => ({
        id: `${Date.now()}_${index}`,
        url: result.url,
        fileName: result.fileName,
        fileSize: result.fileSize,
        fileType: result.fileType,
        uploadedAt: result.uploadedAt,
        storagePath: result.storagePath
      }))

      // Update state
      setUploadedFiles(prev => [...prev, ...newContentFiles])
      setUploadProgress({})
      
      // Notify parent
      onFilesUploaded(newContentFiles)

    } catch (error) {
      console.error('Upload error:', error)
      alert(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }, [uploadedFiles.length, maxFiles, maxFileSize, allowedTypes, uploadPath, onFilesUploaded])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) {
      setIsDragOver(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    if (disabled) return

    const files = Array.from(e.dataTransfer.files)
    handleFiles(files)
  }, [disabled, handleFiles])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    handleFiles(files)
  }, [handleFiles])


  const handleRemoveFile = useCallback((fileId: string) => {
    const fileToRemove = uploadedFiles.find(f => f.id === fileId)
    if (!fileToRemove) return

    // Remove from state
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId))
    
    // Notify parent
    onFilesRemoved?.([fileId])

    // Delete from storage
    FileUploadService.deleteFile(fileToRemove.storagePath).catch(error => {
      console.error('Error deleting file from storage:', error)
    })
  }, [uploadedFiles, onFilesRemoved])

  const getFileIcon = (fileType: string) => {
    if (FileUploadService.isImage(fileType)) return <ImageIcon className="w-5 h-5" />
    if (FileUploadService.isVideo(fileType)) return <VideoIcon className="w-5 h-5" />
    if (FileUploadService.isAudio(fileType)) return <AudioIcon className="w-5 h-5" />
    if (FileUploadService.isDocument(fileType)) return <DocumentIcon className="w-5 h-5" />
    return <File className="w-5 h-5" />
  }

  const renderUploadArea = () => (
    <div
      className={`
        relative border-2 border-dashed rounded-lg p-8 text-center transition-colors duration-200
        ${isDragOver 
          ? 'border-blue-500 bg-blue-50' 
          : 'border-gray-300 hover:border-gray-400'
        }
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
      `}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900 mb-2">
        {isDragOver ? 'Drop files here' : 'Upload files'}
      </h3>
      <p className="text-gray-600 mb-4">
        Drag and drop files here, or click to select files
      </p>
      <div className="text-sm text-gray-500 space-y-1">
        <p>Maximum {maxFiles} files</p>
        <p>Maximum file size: {FileUploadService.formatFileSize(maxFileSize)}</p>
        {allowedTypes && (
          <p>Allowed types: {allowedTypes.join(', ')}</p>
        )}
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        className="hidden"
        onChange={handleFileSelect}
        accept={allowedTypes?.join(',')}
        disabled={disabled}
      />
    </div>
  )

  const renderUploadProgress = () => {
    const filesInProgress = Object.keys(uploadProgress)
    
    if (filesInProgress.length === 0) return null

    return (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-900">Uploading files...</h4>
        {filesInProgress.map(fileName => (
          <div key={fileName} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">{fileName}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress[fileName]}%` }}
                />
              </div>
            </div>
            <span className="text-xs text-gray-500">{Math.round(uploadProgress[fileName])}%</span>
          </div>
        ))}
      </div>
    )
  }

  const renderUploadErrors = () => {
    const errorFiles = Object.keys(uploadErrors)
    
    if (errorFiles.length === 0) return null

    return (
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-red-900">Upload errors:</h4>
        {errorFiles.map(fileName => (
          <div key={fileName} className="flex items-center gap-3 p-3 bg-red-50 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <div className="flex-1">
              <p className="text-sm font-medium text-red-900">{fileName}</p>
              <p className="text-xs text-red-700">{uploadErrors[fileName]}</p>
            </div>
          </div>
        ))}
      </div>
    )
  }

  const renderUploadedFiles = () => {
    if (uploadedFiles.length === 0) return null

    return (
      <div className="mt-4">
        <h4 className="text-sm font-medium text-gray-900 mb-3">
          Uploaded files ({uploadedFiles.length}/{maxFiles})
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {uploadedFiles.map(file => (
            <div key={file.id} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-4 h-4 text-green-500" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {getFileIcon(file.fileType)}
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {file.fileName}
                  </p>
                </div>
                <p className="text-xs text-gray-500">
                  {FileUploadService.formatFileSize(file.fileSize)}
                </p>
              </div>
              <button
                onClick={() => handleRemoveFile(file.id)}
                className="p-1 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {renderUploadArea()}
      {renderUploadProgress()}
      {renderUploadErrors()}
      {renderUploadedFiles()}
    </div>
  )
}

export default FileUpload
