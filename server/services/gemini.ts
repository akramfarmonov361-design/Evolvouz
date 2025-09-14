import { GoogleGenerativeAI } from "@google/generative-ai";

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface GeminiContentRequest {
  prompt: string;
  language: 'uz' | 'en';
  type: 'blog' | 'service' | 'recommendation';
}

export interface BlogPostContent {
  title: string;
  titleEn: string;
  slug: string;
  slugEn: string;
  excerpt: string;
  excerptEn: string;
  content: string;
  contentEn: string;
  category: string;
  categoryEn: string;
  tags: string[];
  tagsEn: string[];
  seoTitle: string;
  seoTitleEn: string;
  seoDescription: string;
  seoDescriptionEn: string;
}

export async function generateBlogPost(topic: string, language: 'uz' | 'en' = 'uz'): Promise<BlogPostContent> {
  const isUzbek = language === 'uz';
  
  const prompt = isUzbek 
    ? `
"${topic}" mavzusida professional blog maqolasi yozing. Maqola AI va biznes sohasida bo'lishi kerak.

Quyidagi JSON formatida javob bering:
{
  "title": "O'zbek tilidagi sarlavha",
  "titleEn": "English title",
  "slug": "uzbek-slug-url",
  "slugEn": "english-slug-url",
  "excerpt": "Qisqa mazmun (1-2 jumla)",
  "excerptEn": "Short excerpt (1-2 sentences)",
  "content": "To'liq maqola matni (HTML format, kamida 500 so'z)",
  "contentEn": "Full article content (HTML format, at least 500 words)",
  "category": "Kategoriya",
  "categoryEn": "Category",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "tagsEn": ["Tag1", "Tag2", "Tag3"],
  "seoTitle": "SEO uchun sarlavha",
  "seoTitleEn": "SEO title",
  "seoDescription": "SEO tavsifi",
  "seoDescriptionEn": "SEO description"
}

Professional va foydali maqola yozing.
`
    : `
Write a professional blog post about "${topic}". The article should be about AI and business.

Provide response in JSON format:
{
  "title": "English title",
  "titleEn": "English title",
  "slug": "english-slug-url", 
  "slugEn": "english-slug-url",
  "excerpt": "Short excerpt (1-2 sentences)",
  "excerptEn": "Short excerpt (1-2 sentences)",
  "content": "Full article content (HTML format, at least 500 words)",
  "contentEn": "Full article content (HTML format, at least 500 words)",
  "category": "Category",
  "categoryEn": "Category",
  "tags": ["Tag1", "Tag2", "Tag3"],
  "tagsEn": ["Tag1", "Tag2", "Tag3"],
  "seoTitle": "SEO title",
  "seoTitleEn": "SEO title",
  "seoDescription": "SEO description",
  "seoDescriptionEn": "SEO description"
}

Write professional and valuable content.
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response - remove markdown code blocks if present
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const content = JSON.parse(cleanText);
    
    return {
      title: content.title || '',
      titleEn: content.titleEn || content.title || '',
      slug: content.slug || '',
      slugEn: content.slugEn || content.slug || '',
      excerpt: content.excerpt || '',
      excerptEn: content.excerptEn || content.excerpt || '',
      content: content.content || '',
      contentEn: content.contentEn || content.content || '',
      category: content.category || 'AI',
      categoryEn: content.categoryEn || content.category || 'AI',
      tags: content.tags || [],
      tagsEn: content.tagsEn || content.tags || [],
      seoTitle: content.seoTitle || content.title || '',
      seoTitleEn: content.seoTitleEn || content.titleEn || content.title || '',
      seoDescription: content.seoDescription || content.excerpt || '',
      seoDescriptionEn: content.seoDescriptionEn || content.excerptEn || content.excerpt || ''
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate blog post with Gemini: " + (error as Error).message);
  }
}

export async function generateServiceRecommendations(
  businessContext: string,
  availableServices: Array<{ id: string; title: string; description: string; category: string }>,
  language: 'uz' | 'en' = 'uz'
): Promise<{
  recommendations: Array<{
    serviceId: string;
    relevanceScore: number;
    reasoning: string;
    benefits: string[];
    timeframe: string;
  }>;
  summary: string;
}> {
  const isUzbek = language === 'uz';
  
  const prompt = isUzbek
    ? `
Biznes konteksti: ${businessContext}

Mavjud xizmatlar:
${availableServices.map(s => `- ${s.title}: ${s.description} (${s.category})`).join('\n')}

Ushbu biznes uchun eng mos xizmatlarni tavsiya qiling va quyidagi JSON formatida javob bering:

{
  "recommendations": [
    {
      "serviceId": "service_id",
      "relevanceScore": 8,
      "reasoning": "Nima uchun bu xizmat mos ekanligini tushuntiring",
      "benefits": ["Foyda 1", "Foyda 2", "Foyda 3"],
      "timeframe": "Amalga oshirish muddati"
    }
  ],
  "summary": "Umumiy tavsiyalar va xulosa"
}
`
    : `
Business context: ${businessContext}

Available services:
${availableServices.map(s => `- ${s.title}: ${s.description} (${s.category})`).join('\n')}

Recommend the most suitable services for this business and provide response in JSON format:

{
  "recommendations": [
    {
      "serviceId": "service_id", 
      "relevanceScore": 8,
      "reasoning": "Explain why this service is suitable",
      "benefits": ["Benefit 1", "Benefit 2", "Benefit 3"],
      "timeframe": "Implementation timeframe"
    }
  ],
  "summary": "Overall recommendations and conclusion"
}
`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const content = JSON.parse(cleanText);
    
    return {
      recommendations: content.recommendations || [],
      summary: content.summary || ''
    };
  } catch (error) {
    console.error("Gemini API error:", error);
    throw new Error("Failed to generate recommendations with Gemini: " + (error as Error).message);
  }
}