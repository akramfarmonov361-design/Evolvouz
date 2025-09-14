import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY_ENV_VAR || "default_key"
});

export interface BusinessRecommendationRequest {
  businessType: string;
  businessSize: string;
  currentChallenges: string[];
  industry: string;
  budget?: string;
  language: 'uz' | 'en';
}

export interface ServiceRecommendation {
  serviceId: string;
  relevanceScore: number;
  reasoning: string;
  expectedBenefits: string[];
  implementationTimeframe: string;
}

export interface AIRecommendationResponse {
  recommendations: ServiceRecommendation[];
  summary: string;
  priorityOrder: string[];
}

export async function generateBusinessRecommendations(
  request: BusinessRecommendationRequest,
  availableServices: Array<{ id: string; title: string; description: string; category: string; features: string[] }>
): Promise<AIRecommendationResponse> {
  const isUzbek = request.language === 'uz';
  
  const systemPrompt = isUzbek 
    ? `Siz AI biznes maslahatchi sifatida ishlaydigan mutaxassisiz. Uzbekistondagi bizneslar uchun AI yechimlari tavsiya qilasiz. Javobingizni faqat JSON formatida bering.`
    : `You are an AI business consultant specializing in AI solutions for businesses in Uzbekistan. Provide your response only in JSON format.`;

  const userPrompt = isUzbek
    ? `
Biznes turi: ${request.businessType}
Biznes hajmi: ${request.businessSize}
Joriy muammolar: ${request.currentChallenges.join(', ')}
Soha: ${request.industry}
${request.budget ? `Byudjet: ${request.budget}` : ''}

Mavjud AI xizmatlar:
${availableServices.map(s => `- ${s.title}: ${s.description} (Kategoriya: ${s.category})`).join('\n')}

Ushbu biznes uchun eng mos AI xizmatlarni tavsiya qiling. Har bir tavsiya uchun relevance score (1-10), sabab, kutilayotgan foyda va amalga oshirish vaqtini bering.

JSON format:
{
  "recommendations": [
    {
      "serviceId": "service_id",
      "relevanceScore": 8,
      "reasoning": "Nima uchun bu xizmat mos",
      "expectedBenefits": ["Foyda 1", "Foyda 2"],
      "implementationTimeframe": "2-4 hafta"
    }
  ],
  "summary": "Umumiy xulosalar va tavsiyalar",
  "priorityOrder": ["service_id_1", "service_id_2"]
}
`
    : `
Business Type: ${request.businessType}
Business Size: ${request.businessSize}
Current Challenges: ${request.currentChallenges.join(', ')}
Industry: ${request.industry}
${request.budget ? `Budget: ${request.budget}` : ''}

Available AI Services:
${availableServices.map(s => `- ${s.title}: ${s.description} (Category: ${s.category})`).join('\n')}

Recommend the most suitable AI services for this business. For each recommendation provide relevance score (1-10), reasoning, expected benefits, and implementation timeframe.

JSON format:
{
  "recommendations": [
    {
      "serviceId": "service_id",
      "relevanceScore": 8,
      "reasoning": "Why this service fits",
      "expectedBenefits": ["Benefit 1", "Benefit 2"],
      "implementationTimeframe": "2-4 weeks"
    }
  ],
  "summary": "Overall conclusions and recommendations",
  "priorityOrder": ["service_id_1", "service_id_2"]
}
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      recommendations: result.recommendations || [],
      summary: result.summary || '',
      priorityOrder: result.priorityOrder || []
    };
  } catch (error) {
    throw new Error("Failed to generate AI recommendations: " + (error as Error).message);
  }
}

export async function generateServiceContent(
  serviceType: string,
  language: 'uz' | 'en' = 'uz'
): Promise<{
  title: string;
  description: string;
  shortDescription: string;
  features: string[];
  category: string;
}> {
  const isUzbek = language === 'uz';
  
  const prompt = isUzbek
    ? `
"${serviceType}" AI xizmati uchun kontent yarating. Javobni JSON formatida bering:

{
  "title": "Xizmat nomi",
  "description": "Batafsil tavsif (2-3 jumla)",
  "shortDescription": "Qisqa tavsif (1 jumla)",
  "features": ["Xususiyat 1", "Xususiyat 2", "Xususiyat 3"],
  "category": "Kategoriya nomi"
}

O'zbek tilidagi professional va aniq matn yozing.
`
    : `
Create content for "${serviceType}" AI service. Provide response in JSON format:

{
  "title": "Service name",
  "description": "Detailed description (2-3 sentences)",
  "shortDescription": "Brief description (1 sentence)",
  "features": ["Feature 1", "Feature 2", "Feature 3"],
  "category": "Category name"
}

Write professional and clear English text.
`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.5,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');
    
    return {
      title: result.title || '',
      description: result.description || '',
      shortDescription: result.shortDescription || '',
      features: result.features || [],
      category: result.category || ''
    };
  } catch (error) {
    throw new Error("Failed to generate service content: " + (error as Error).message);
  }
}
