import React, { useState } from 'react'
import { BrandLead } from '../../types/brandDiscovery'
import { 
  ExternalLink, 
  Mail, 
  Phone, 
  Globe, 
  Calendar, 
  Tag, 
  Edit3,
  Trash2,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface BrandLeadCardProps {
  brand: BrandLead
  onUpdateStatus: (status: BrandLead['status']) => void
  onAddNote: (note: string) => void
  onUpdate: (updates: Partial<BrandLead>) => void
  onDelete: () => void
}

const BrandLeadCard: React.FC<BrandLeadCardProps> = ({
  brand,
  onUpdateStatus,
  onAddNote,
  onUpdate,
  onDelete
}) => {
  const [showNotes, setShowNotes] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [newNote, setNewNote] = useState('')

  const getStatusColor = (status: BrandLead['status']) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'contacted':
        return 'bg-yellow-100 text-yellow-800'
      case 'responded':
        return 'bg-green-100 text-green-800'
      case 'negotiating':
        return 'bg-purple-100 text-purple-800'
      case 'closed':
        return 'bg-gray-100 text-gray-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: BrandLead['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800'
      case 'low':
        return 'bg-green-100 text-green-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: BrandLead['status']) => {
    switch (status) {
      case 'new':
        return <AlertCircle className="w-4 h-4" />
      case 'contacted':
        return <Clock className="w-4 h-4" />
      case 'responded':
      case 'negotiating':
      case 'closed':
        return <CheckCircle className="w-4 h-4" />
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />
      default:
        return <Clock className="w-4 h-4" />
    }
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date)
  }

  const handleAddNote = () => {
    if (newNote.trim()) {
      onAddNote(newNote.trim())
      setNewNote('')
      setShowNotes(false)
    }
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h4 className="font-semibold text-lg text-gray-900">{brand.brandName}</h4>
            <span className={`px-2 py-1 text-xs rounded-full flex items-center gap-1 ${getStatusColor(brand.status)}`}>
              {getStatusIcon(brand.status)}
              {brand.status}
            </span>
            <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(brand.priority)}`}>
              {brand.priority}
            </span>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
            <span className="flex items-center gap-1">
              <Tag className="w-4 h-4" />
              {brand.platform}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(brand.detectedAt)}
            </span>
            {brand.engagementRate && (
              <span>{brand.engagementRate}% engagement</span>
            )}
          </div>
          
          {brand.sponsorshipSignals.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {brand.sponsorshipSignals.map(signal => (
                <span 
                  key={signal} 
                  className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                >
                  {signal}
                </span>
              ))}
            </div>
          )}
          
          {brand.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-3">
              {brand.tags.map(tag => (
                <span 
                  key={tag} 
                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex gap-2">
          <button
            onClick={() => setIsEditing(!isEditing)}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            title="Edit"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={onDelete}
            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      
      {/* Contact Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {brand.websiteUrl && (
          <div className="flex items-center gap-2 text-sm">
            <Globe className="w-4 h-4 text-gray-400" />
            <a 
              href={brand.websiteUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {brand.websiteUrl}
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}
        
        {brand.emailContact && (
          <div className="flex items-center gap-2 text-sm">
            <Mail className="w-4 h-4 text-gray-400" />
            <a 
              href={`mailto:${brand.emailContact}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {brand.emailContact}
            </a>
          </div>
        )}
        
        {brand.phoneContact && (
          <div className="flex items-center gap-2 text-sm">
            <Phone className="w-4 h-4 text-gray-400" />
            <a 
              href={`tel:${brand.phoneContact}`}
              className="text-blue-600 hover:text-blue-800"
            >
              {brand.phoneContact}
            </a>
          </div>
        )}
        
        {brand.brandHandle && (
          <div className="flex items-center gap-2 text-sm">
            <Tag className="w-4 h-4 text-gray-400" />
            <span className="text-gray-700">{brand.brandHandle}</span>
          </div>
        )}
      </div>
      
      {/* Status Update */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-gray-700">Status:</label>
        <select 
          value={brand.status}
          onChange={(e) => onUpdateStatus(e.target.value as BrandLead['status'])}
          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="new">New</option>
          <option value="contacted">Contacted</option>
          <option value="responded">Responded</option>
          <option value="negotiating">Negotiating</option>
          <option value="closed">Closed</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>
      
      {/* Notes Section */}
      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-2">
          <h5 className="text-sm font-medium text-gray-700">Notes</h5>
          <button
            onClick={() => setShowNotes(!showNotes)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showNotes ? 'Cancel' : 'Add Note'}
          </button>
        </div>
        
        {showNotes && (
          <div className="mb-3">
            <textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              placeholder="Add a note about this brand..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={handleAddNote}
                className="px-3 py-1 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
              >
                Add Note
              </button>
              <button
                onClick={() => {
                  setShowNotes(false)
                  setNewNote('')
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
        
        {brand.notes && (
          <div className="p-3 bg-gray-50 rounded-md">
            <p className="text-sm text-gray-700">{brand.notes}</p>
          </div>
        )}
      </div>
      
      {/* Follow-up Information */}
      {(brand.lastContactDate || brand.nextFollowUpDate) && (
        <div className="border-t pt-4 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            {brand.lastContactDate && (
              <div>
                <span className="text-gray-500">Last Contact:</span>
                <span className="ml-2 text-gray-700">{formatDate(brand.lastContactDate)}</span>
              </div>
            )}
            {brand.nextFollowUpDate && (
              <div>
                <span className="text-gray-500">Next Follow-up:</span>
                <span className="ml-2 text-gray-700">{formatDate(brand.nextFollowUpDate)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BrandLeadCard

