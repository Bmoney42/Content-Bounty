import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  limit,
  Timestamp 
} from 'firebase/firestore'
import { db } from '../config/firebase'
import { BrandLead, ScrapingJob, AddBrandLeadData, BrandDiscoveryFilters, SPONSORSHIP_PATTERNS } from '../types/brandDiscovery'

// Generate unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

export class BrandDiscoveryService {
  private brandLeadsCollection = 'brandLeads'
  private scrapingJobsCollection = 'scrapingJobs'
  
  // Add manual brand lead
  async addManualBrandLead(creatorId: string, brandData: AddBrandLeadData): Promise<BrandLead> {
    try {
      const brandLead: BrandLead = {
        id: generateId(),
        creatorId,
        ...brandData,
        platform: brandData.platform || 'manual',
        detectedAt: new Date(),
        status: 'new',
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      await addDoc(collection(db, this.brandLeadsCollection), {
        ...brandLead,
        detectedAt: Timestamp.fromDate(brandLead.detectedAt),
        createdAt: Timestamp.fromDate(brandLead.createdAt),
        updatedAt: Timestamp.fromDate(brandLead.updatedAt)
      })
      
      return brandLead
    } catch (error) {
      console.error('Error adding brand lead:', error)
      throw new Error('Failed to add brand lead')
    }
  }
  
  // Get creator's brand leads
  async getBrandLeads(creatorId: string, filters?: BrandDiscoveryFilters): Promise<BrandLead[]> {
    try {
      let q = query(
        collection(db, this.brandLeadsCollection),
        where('creatorId', '==', creatorId),
        orderBy('createdAt', 'desc')
      )
      
      if (filters?.status) {
        q = query(q, where('status', '==', filters.status))
      }
      
      if (filters?.platform) {
        q = query(q, where('platform', '==', filters.platform))
      }
      
      if (filters?.priority) {
        q = query(q, where('priority', '==', filters.priority))
      }
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          detectedAt: data.detectedAt?.toDate() || new Date(),
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          lastContactDate: data.lastContactDate?.toDate(),
          nextFollowUpDate: data.nextFollowUpDate?.toDate()
        } as BrandLead
      })
    } catch (error) {
      console.error('Error getting brand leads:', error)
      throw new Error('Failed to get brand leads')
    }
  }
  
  // Update brand lead status
  async updateBrandLeadStatus(leadId: string, status: BrandLead['status'], notes?: string): Promise<void> {
    try {
      const leadRef = doc(db, this.brandLeadsCollection, leadId)
      const updateData: any = {
        status,
        updatedAt: Timestamp.fromDate(new Date())
      }
      
      if (notes) {
        updateData.notes = notes
      }
      
      if (status === 'contacted') {
        updateData.lastContactDate = Timestamp.fromDate(new Date())
      }
      
      await updateDoc(leadRef, updateData)
    } catch (error) {
      console.error('Error updating brand lead status:', error)
      throw new Error('Failed to update brand lead status')
    }
  }
  
  // Update brand lead
  async updateBrandLead(leadId: string, updateData: Partial<BrandLead>): Promise<void> {
    try {
      const leadRef = doc(db, this.brandLeadsCollection, leadId)
      const firestoreData: any = {
        ...updateData,
        updatedAt: Timestamp.fromDate(new Date())
      }
      
      // Convert Date objects to Timestamps
      if (updateData.lastContactDate) {
        firestoreData.lastContactDate = Timestamp.fromDate(updateData.lastContactDate)
      }
      if (updateData.nextFollowUpDate) {
        firestoreData.nextFollowUpDate = Timestamp.fromDate(updateData.nextFollowUpDate)
      }
      
      await updateDoc(leadRef, firestoreData)
    } catch (error) {
      console.error('Error updating brand lead:', error)
      throw new Error('Failed to update brand lead')
    }
  }
  
  // Delete brand lead
  async deleteBrandLead(leadId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, this.brandLeadsCollection, leadId))
    } catch (error) {
      console.error('Error deleting brand lead:', error)
      throw new Error('Failed to delete brand lead')
    }
  }
  
  // Start Apify scraping
  async startApifyScraping(creatorId: string, platforms: string[], searchTerms: string[]): Promise<ScrapingJob> {
    try {
      // Create scraping job
      const job: ScrapingJob = {
        id: generateId(),
        creatorId,
        platform: platforms[0] as 'instagram' | 'tiktok' | 'youtube',
        status: 'pending',
        startedAt: new Date(),
        leadsFound: 0,
        progress: 0
      }
      
      await addDoc(collection(db, this.scrapingJobsCollection), {
        ...job,
        startedAt: Timestamp.fromDate(job.startedAt)
      })
      
      // Start Apify scraping
      const response = await fetch('/api/apify/start-scraping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId,
          platforms,
          searchTerms,
          jobId: job.id
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to start scraping')
      }
      
      return job
    } catch (error) {
      console.error('Error starting Apify scraping:', error)
      throw new Error('Failed to start scraping')
    }
  }
  
  // Get scraping jobs for creator
  async getScrapingJobs(creatorId: string): Promise<ScrapingJob[]> {
    try {
      const q = query(
        collection(db, this.scrapingJobsCollection),
        where('creatorId', '==', creatorId),
        orderBy('startedAt', 'desc')
      )
      
      const snapshot = await getDocs(q)
      return snapshot.docs.map(doc => {
        const data = doc.data()
        return {
          ...data,
          id: doc.id,
          startedAt: data.startedAt?.toDate() || new Date(),
          completedAt: data.completedAt?.toDate()
        } as ScrapingJob
      })
    } catch (error) {
      console.error('Error getting scraping jobs:', error)
      throw new Error('Failed to get scraping jobs')
    }
  }
  
  // Detect sponsorship signals in text
  detectSponsorshipSignals(text: string, hashtags: string[] = []): string[] {
    const signals: string[] = []
    const lowerText = text.toLowerCase()
    const lowerHashtags = hashtags.map(h => h.toLowerCase())
    
    // Check hashtags
    SPONSORSHIP_PATTERNS.hashtags.forEach(pattern => {
      if (lowerHashtags.includes(pattern.toLowerCase())) {
        signals.push(pattern)
      }
    })
    
    // Check text patterns
    SPONSORSHIP_PATTERNS.text.forEach(pattern => {
      if (lowerText.includes(pattern.toLowerCase())) {
        signals.push(pattern)
      }
    })
    
    return [...new Set(signals)] // Remove duplicates
  }
  
  // Process scraped results into brand leads
  async processScrapingResults(jobId: string, results: any[]): Promise<BrandLead[]> {
    try {
      const jobDoc = await getDoc(doc(db, this.scrapingJobsCollection, jobId))
      if (!jobDoc.exists()) {
        throw new Error('Scraping job not found')
      }
      
      const job = jobDoc.data() as ScrapingJob
      const brandLeads: BrandLead[] = []
      
      for (const result of results) {
        const signals = this.detectSponsorshipSignals(
          result.caption || result.desc || result.title || '',
          result.hashtags || []
        )
        
        if (signals.length > 0) {
          const brandLead: BrandLead = {
            id: generateId(),
            creatorId: job.creatorId,
            brandName: this.extractBrandName(result),
            platform: job.platform,
            sourcePostId: result.id,
            sourceUrl: result.url || result.videoUrl,
            detectedAt: new Date(),
            sponsorshipSignals: signals,
            brandHandle: this.extractBrandHandle(result),
            websiteUrl: this.extractWebsite(result),
            engagementRate: this.calculateEngagementRate(result),
            followerCount: result.ownerFollowersCount || result.authorMeta?.fans,
            status: 'new',
            tags: [],
            priority: 'medium',
            createdAt: new Date(),
            updatedAt: new Date()
          }
          
          brandLeads.push(brandLead)
        }
      }
      
      // Save brand leads to Firebase
      for (const lead of brandLeads) {
        await addDoc(collection(db, this.brandLeadsCollection), {
          ...lead,
          detectedAt: Timestamp.fromDate(lead.detectedAt),
          createdAt: Timestamp.fromDate(lead.createdAt),
          updatedAt: Timestamp.fromDate(lead.updatedAt)
        })
      }
      
      // Update scraping job
      await updateDoc(doc(db, this.scrapingJobsCollection, jobId), {
        status: 'completed',
        completedAt: Timestamp.fromDate(new Date()),
        leadsFound: brandLeads.length,
        progress: 100
      })
      
      return brandLeads
    } catch (error) {
      console.error('Error processing scraping results:', error)
      throw new Error('Failed to process scraping results')
    }
  }
  
  // Helper methods for extracting brand information
  private extractBrandName(result: any): string {
    // Try to extract brand name from various fields
    if (result.ownerUsername) return result.ownerUsername
    if (result.authorMeta?.name) return result.authorMeta.name
    if (result.channelTitle) return result.channelTitle
    return 'Unknown Brand'
  }
  
  private extractBrandHandle(result: any): string | undefined {
    if (result.ownerUsername) return `@${result.ownerUsername}`
    if (result.authorMeta?.name) return `@${result.authorMeta.name}`
    return undefined
  }
  
  private extractWebsite(result: any): string | undefined {
    // Look for website links in bio or description
    const text = result.bio || result.description || ''
    const urlMatch = text.match(/https?:\/\/[^\s]+/)
    return urlMatch ? urlMatch[0] : undefined
  }
  
  private calculateEngagementRate(result: any): number | undefined {
    const likes = result.likesCount || result.diggCount || 0
    const comments = result.commentsCount || 0
    const shares = result.sharesCount || 0
    const followers = result.ownerFollowersCount || result.authorMeta?.fans || 0
    
    if (followers === 0) return undefined
    
    const engagement = likes + comments + shares
    return Math.round((engagement / followers) * 100 * 100) / 100 // Round to 2 decimal places
  }
}

// Export singleton instance
export const brandDiscoveryService = new BrandDiscoveryService()

