import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject,
  listAll,
  StorageReference
} from 'firebase/storage'
import { storage } from '../config/firebase'

// File types and size limits
export const FILE_CONFIG = {
  MAX_FILE_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_TYPES: {
    IMAGE: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    VIDEO: ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/webm'],
    AUDIO: ['audio/mp3', 'audio/wav', 'audio/m4a', 'audio/aac'],
    DOCUMENT: ['application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
    ARCHIVE: ['application/zip', 'application/rar', 'application/7z']
  },
  MAX_FILES_PER_UPLOAD: 10
}

// File upload progress callback
export type UploadProgressCallback = (progress: number, fileName: string) => void

// File upload result
export interface FileUploadResult {
  url: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: Date
  storagePath: string
}

// File validation result
export interface FileValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
}

// Content type for bounty submissions
export interface ContentFile {
  id: string
  url: string
  fileName: string
  fileSize: number
  fileType: string
  uploadedAt: Date
  storagePath: string
  thumbnailUrl?: string
  duration?: number // for videos/audio
  dimensions?: { width: number; height: number } // for images/videos
}

export class FileUploadService {
  // Validate file before upload
  static validateFile(file: File): FileValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    // Check file size
    if (file.size > FILE_CONFIG.MAX_FILE_SIZE) {
      errors.push(`File size exceeds maximum limit of ${FILE_CONFIG.MAX_FILE_SIZE / (1024 * 1024)}MB`)
    }

    // Check file type
    const allowedTypes = [
      ...FILE_CONFIG.ALLOWED_TYPES.IMAGE,
      ...FILE_CONFIG.ALLOWED_TYPES.VIDEO,
      ...FILE_CONFIG.ALLOWED_TYPES.AUDIO,
      ...FILE_CONFIG.ALLOWED_TYPES.DOCUMENT,
      ...FILE_CONFIG.ALLOWED_TYPES.ARCHIVE
    ]

    if (!allowedTypes.includes(file.type)) {
      errors.push(`File type ${file.type} is not allowed`)
    }

    // Check for potentially dangerous files
    if (file.name.toLowerCase().includes('.exe') || file.name.toLowerCase().includes('.bat')) {
      errors.push('Executable files are not allowed for security reasons')
    }

    // Warnings for large files
    if (file.size > 50 * 1024 * 1024) { // 50MB
      warnings.push('Large file detected - upload may take longer')
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    }
  }

  // Upload single file
  static async uploadFile(
    file: File,
    path: string,
    onProgress?: UploadProgressCallback
  ): Promise<FileUploadResult> {
    return new Promise((resolve, reject) => {
      // Validate file first
      const validation = this.validateFile(file)
      if (!validation.isValid) {
        reject(new Error(`File validation failed: ${validation.errors.join(', ')}`))
        return
      }

      // Create storage reference
      const storageRef = ref(storage, `${path}/${Date.now()}_${file.name}`)
      
      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file)

      // Monitor upload progress
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100
          onProgress?.(progress, file.name)
        },
        (error) => {
          console.error('Upload error:', error)
          reject(error)
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref)
            
            const result: FileUploadResult = {
              url: downloadURL,
              fileName: file.name,
              fileSize: file.size,
              fileType: file.type,
              uploadedAt: new Date(),
              storagePath: uploadTask.snapshot.ref.fullPath
            }

            resolve(result)
          } catch (error) {
            reject(error)
          }
        }
      )
    })
  }

  // Upload multiple files
  static async uploadMultipleFiles(
    files: File[],
    path: string,
    onProgress?: UploadProgressCallback
  ): Promise<FileUploadResult[]> {
    // Validate all files first
    const validations = files.map(file => this.validateFile(file))
    const invalidFiles = validations.filter(v => !v.isValid)
    
    if (invalidFiles.length > 0) {
      throw new Error(`Some files failed validation: ${invalidFiles.map(v => v.errors.join(', ')).join('; ')}`)
    }

    // Check file count limit
    if (files.length > FILE_CONFIG.MAX_FILES_PER_UPLOAD) {
      throw new Error(`Maximum ${FILE_CONFIG.MAX_FILES_PER_UPLOAD} files allowed per upload`)
    }

    // Upload files in parallel
    const uploadPromises = files.map(file => 
      this.uploadFile(file, path, onProgress)
    )

    return Promise.all(uploadPromises)
  }

  // Delete file from storage
  static async deleteFile(storagePath: string): Promise<void> {
    try {
      const fileRef = ref(storage, storagePath)
      await deleteObject(fileRef)
      console.log('File deleted successfully:', storagePath)
    } catch (error) {
      console.error('Error deleting file:', error)
      throw error
    }
  }

  // Delete multiple files
  static async deleteMultipleFiles(storagePaths: string[]): Promise<void> {
    const deletePromises = storagePaths.map(path => this.deleteFile(path))
    await Promise.all(deletePromises)
  }

  // Get file metadata
  static async getFileMetadata(storagePath: string): Promise<any> {
    try {
      const fileRef = ref(storage, storagePath)
      // Note: Firebase Storage doesn't provide metadata API in client SDK
      // This would need to be implemented on the server side
      return {
        path: storagePath,
        exists: true
      }
    } catch (error) {
      console.error('Error getting file metadata:', error)
      throw error
    }
  }

  // List files in a directory
  static async listFiles(path: string): Promise<StorageReference[]> {
    try {
      const listRef = ref(storage, path)
      const result = await listAll(listRef)
      return result.items
    } catch (error) {
      console.error('Error listing files:', error)
      throw error
    }
  }

  // Generate thumbnail for image/video
  static async generateThumbnail(file: File): Promise<string | null> {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        // For images, create a thumbnail using canvas
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
          // Set canvas size for thumbnail
          const maxSize = 200
          const ratio = Math.min(maxSize / img.width, maxSize / img.height)
          canvas.width = img.width * ratio
          canvas.height = img.height * ratio
          
          // Draw image on canvas
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)
          
          // Convert to data URL
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
          resolve(thumbnailUrl)
        }
        
        img.src = URL.createObjectURL(file)
      } else if (file.type.startsWith('video/')) {
        // For videos, create a thumbnail from first frame
        const video = document.createElement('video')
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        video.onloadeddata = () => {
          canvas.width = video.videoWidth
          canvas.height = video.videoHeight
          ctx?.drawImage(video, 0, 0)
          
          const thumbnailUrl = canvas.toDataURL('image/jpeg', 0.8)
          resolve(thumbnailUrl)
        }
        
        video.src = URL.createObjectURL(file)
        video.currentTime = 0.1 // Seek to first frame
      } else {
        resolve(null)
      }
    })
  }

  // Get file type category
  static getFileTypeCategory(fileType: string): string {
    if (FILE_CONFIG.ALLOWED_TYPES.IMAGE.includes(fileType)) return 'image'
    if (FILE_CONFIG.ALLOWED_TYPES.VIDEO.includes(fileType)) return 'video'
    if (FILE_CONFIG.ALLOWED_TYPES.AUDIO.includes(fileType)) return 'audio'
    if (FILE_CONFIG.ALLOWED_TYPES.DOCUMENT.includes(fileType)) return 'document'
    if (FILE_CONFIG.ALLOWED_TYPES.ARCHIVE.includes(fileType)) return 'archive'
    return 'other'
  }

  // Format file size for display
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Get file extension
  static getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || ''
  }

  // Check if file is an image
  static isImage(fileType: string): boolean {
    return fileType.startsWith('image/')
  }

  // Check if file is a video
  static isVideo(fileType: string): boolean {
    return fileType.startsWith('video/')
  }

  // Check if file is an audio file
  static isAudio(fileType: string): boolean {
    return fileType.startsWith('audio/')
  }

  // Check if file is a document
  static isDocument(fileType: string): boolean {
    return FILE_CONFIG.ALLOWED_TYPES.DOCUMENT.includes(fileType)
  }
}
