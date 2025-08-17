import { franc } from 'franc-min';
import { Notice } from 'obsidian';

export function detectLanguage(text: string): string {
  if (!text || text.trim().length < 50) {
    return 'unknown';
  }
  
  const detected = franc(text);
  
  // Mapping ISO 639-3 codes to readable language names
  const languageMap: { [key: string]: string } = {
    'rus': 'Russian',
    'eng': 'English',
    'fra': 'French',
    'deu': 'German',
    'spa': 'Spanish',
    'ita': 'Italian',
    'por': 'Portuguese',
    'und': 'unknown'
  };
  
  return languageMap[detected] || 'English';
}

export function cleanContent(content: string, includeExistingTitle: boolean = false): string {
  let cleanedContent = content;
  
  if (!includeExistingTitle) {
    // Remove only headers if we don't need to consider them
    cleanedContent = cleanedContent.replace(/#{1,6}\s/g, '');
  }
  
  // Remove remaining markdown formatting and clean up the text
  return cleanedContent
    .replace(/\*\*(.*?)\*\*/g, '$1') // bold text
    .replace(/\*(.*?)\*/g, '$1') // italic
    .replace(/`(.*?)`/g, '$1') // code
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // links
    .replace(/!\[.*?\]\(.*?\)/g, '') // images
    .replace(/^\s*[-*+]\s/gm, '') // lists
    .replace(/^\s*\d+\.\s/gm, '') // numbered lists
    .replace(/\n{3,}/g, '\n\n') // multiple line breaks
    .trim();
}

export async function generateTitle(content: string, apiKey: string, model: string, temperature: number, language: string, includeExistingTitle: boolean = false): Promise<string> {
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured');
  }
  
  if (!content || content.trim().length < 10) {
    throw new Error('Not enough content to generate a title');
  }
  
  const cleanedContent = cleanContent(content, includeExistingTitle);
  const detectedLang = language === 'auto' ? detectLanguage(cleanedContent) : language;
  
  let prompt = `Generate a concise and meaningful title for the following text in "${detectedLang}". The title should be as informative as possible and reflect the main theme of the content.`;
  
  if (includeExistingTitle) {
    prompt += ` Consider the existing title in the text, but create a more suitable version.`;
  } else {
    prompt += ` Ignore any existing titles and focus only on the content.`;
  }
  
  prompt += ` Return only the title, without any additional explanations:

${cleanedContent.substring(0, 2000)}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: temperature,
        max_tokens: 60
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const title = data.choices[0]?.message?.content?.trim();
    
    if (!title) {
      throw new Error('Failed to get title from OpenAI');
    }
    
    // Clean up the title by removing quotes, extra characters, and unwanted phrases
    let cleanedTitle = title.replace(/^["']|["']$/g, '').trim();
    
    // Remove specific unwanted command artifacts that might appear in AI responses
    cleanedTitle = cleanedTitle.replace(/claude --dangerously-skip-permissions\s*/gi, '');
    cleanedTitle = cleanedTitle.replace(/--dangerously-skip-permissions\s*/gi, '');
    cleanedTitle = cleanedTitle.replace(/^\s*claude\s+/gi, ''); // Only remove "claude" at the beginning
    
    return cleanedTitle.trim();
    
  } catch (error) {
    console.error('Error generating title:', error);
    throw error;
  }
}

export function showNotice(message: string, duration: number = 5000) {
  new Notice(message, duration);
}
