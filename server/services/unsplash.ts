import fetch from 'node-fetch';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY || '';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

export interface UnsplashImage {
  id: string;
  url: string;
  thumbnailUrl: string;
  description: string;
  altText: string;
  photographer: string;
  photographerUrl: string;
  downloadUrl: string;
  width: number;
  height: number;
}

export interface ImageSearchOptions {
  query: string;
  count?: number;
  orientation?: 'landscape' | 'portrait' | 'squarish';
  category?: string;
}

export async function searchImages(options: ImageSearchOptions): Promise<UnsplashImage[]> {
  const { query, count = 12, orientation = 'landscape' } = options;
  
  if (!UNSPLASH_ACCESS_KEY) {
    throw new Error('Unsplash API key not configured');
  }

  try {
    const searchParams = new URLSearchParams({
      query,
      per_page: count.toString(),
      orientation,
      order_by: 'relevant'
    });

    const response = await fetch(`${UNSPLASH_API_URL}/search/photos?${searchParams}`, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1'
      }
    });

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as any;
    
    return data.results.map((photo: any): UnsplashImage => ({
      id: photo.id,
      url: photo.urls.regular,
      thumbnailUrl: photo.urls.thumb,
      description: photo.description || photo.alt_description || '',
      altText: photo.alt_description || photo.description || `Photo by ${photo.user.name}`,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      downloadUrl: photo.links.download,
      width: photo.width,
      height: photo.height
    }));
  } catch (error) {
    console.error("Unsplash API error:", error);
    throw new Error("Failed to search images: " + (error as Error).message);
  }
}

export async function getImageForTopic(topic: string, language: 'uz' | 'en' = 'uz'): Promise<UnsplashImage | null> {
  try {
    // Create search terms based on topic and language
    const searchTerms = language === 'uz' 
      ? `${topic} business technology uzbekistan`
      : `${topic} business technology artificial intelligence`;
    
    const images = await searchImages({
      query: searchTerms,
      count: 1,
      orientation: 'landscape'
    });
    
    return images.length > 0 ? images[0] : null;
  } catch (error) {
    console.error("Error getting image for topic:", error);
    return null;
  }
}

export async function getFeaturedImages(category: string = 'business'): Promise<UnsplashImage[]> {
  try {
    return await searchImages({
      query: `${category} professional modern`,
      count: 6,
      orientation: 'landscape'
    });
  } catch (error) {
    console.error("Error getting featured images:", error);
    return [];
  }
}

// Track download for Unsplash attribution requirements
export async function trackImageDownload(imageId: string): Promise<void> {
  if (!UNSPLASH_ACCESS_KEY) {
    return;
  }

  try {
    await fetch(`${UNSPLASH_API_URL}/photos/${imageId}/download`, {
      headers: {
        'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        'Accept-Version': 'v1'
      }
    });
  } catch (error) {
    console.error("Error tracking image download:", error);
    // Don't throw error for tracking failures
  }
}