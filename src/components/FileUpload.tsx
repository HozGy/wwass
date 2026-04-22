import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, FileText, Image as ImageIcon } from 'lucide-react'

interface FileUploadProps {
  onFilesChange: (files: File[]) => void
  accept?: { [key: string]: string[] }
  maxSize?: number
}

export default function FileUpload({
  onFilesChange,
  accept = {
    'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'application/pdf': ['.pdf'],
  },
  maxSize = 10 * 1024 * 1024, // 10MB
}: FileUploadProps) {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const newFiles = [...uploadedFiles, ...acceptedFiles]
      setUploadedFiles(newFiles)
      onFilesChange(newFiles)
    },
    [uploadedFiles, onFilesChange]
  )

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize,
  })

  function removeFile(index: number) {
    const newFiles = uploadedFiles.filter((_, i) => i !== index)
    setUploadedFiles(newFiles)
    onFilesChange(newFiles)
  }

  function isImage(filename: string) {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(filename)
  }

  function formatFileSize(bytes: number) {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        {isDragActive ? (
          <p className="text-blue-600">วางไฟล์ที่นี่...</p>
        ) : (
          <div>
            <p className="text-gray-600 mb-2">
              ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเลือกไฟล์
            </p>
            <p className="text-sm text-gray-400">
              รองรับไฟล์รูปภาพ (JPG, PNG, GIF, WebP) และ PDF (สูงสุด 10MB)
            </p>
          </div>
        )}
      </div>

      {uploadedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">ไฟล์ที่เลือก:</h4>
          {uploadedFiles.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center justify-between bg-gray-50 rounded-lg p-3"
            >
              <div className="flex items-center space-x-3">
                {isImage(file.name) ? (
                  <ImageIcon className="h-5 w-5 text-blue-500" />
                ) : (
                  <FileText className="h-5 w-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium text-gray-900">{file.name}</p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
