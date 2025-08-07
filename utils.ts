import { franc } from 'franc-min';
import { Notice } from 'obsidian';

export function detectLanguage(text: string): string {
  if (!text || text.trim().length < 50) {
    return 'unknown';
  }
  
  const detected = franc(text);
  
  // Маппинг ISO 639-3 кодов на читаемые названия языков
  const languageMap: { [key: string]: string } = {
    'rus': 'русский',
    'eng': 'английский',
    'fra': 'французский',
    'deu': 'немецкий',
    'spa': 'испанский',
    'ita': 'итальянский',
    'por': 'португальский',
    'und': 'unknown'
  };
  
  return languageMap[detected] || 'английский';
}

export function cleanContent(content: string, includeExistingTitle: boolean = false): string {
  let cleanedContent = content;
  
  if (!includeExistingTitle) {
    // Удаляем только заголовки, если не нужно их учитывать
    cleanedContent = cleanedContent.replace(/#{1,6}\s/g, '');
  }
  
  // Удаляем остальную markdown разметку и очищаем текст
  return cleanedContent
    .replace(/\*\*(.*?)\*\*/g, '$1') // жирный текст
    .replace(/\*(.*?)\*/g, '$1') // курсив
    .replace(/`(.*?)`/g, '$1') // код
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // ссылки
    .replace(/!\[.*?\]\(.*?\)/g, '') // изображения
    .replace(/^\s*[-*+]\s/gm, '') // списки
    .replace(/^\s*\d+\.\s/gm, '') // нумерованные списки
    .replace(/\n{3,}/g, '\n\n') // множественные переносы
    .trim();
}

export async function generateTitle(content: string, apiKey: string, model: string, temperature: number, language: string, includeExistingTitle: boolean = false): Promise<string> {
  if (!apiKey) {
    throw new Error('API ключ OpenAI не настроен');
  }
  
  if (!content || content.trim().length < 10) {
    throw new Error('Недостаточно содержимого для генерации заголовка');
  }
  
  const cleanedContent = cleanContent(content, includeExistingTitle);
  const detectedLang = language === 'auto' ? detectLanguage(cleanedContent) : language;
  
  let prompt = `Сгенерируй краткий и содержательный заголовок для следующего текста на языке "${detectedLang}". Заголовок должен быть максимально информативным и отражать основную тему содержимого.`;
  
  if (includeExistingTitle) {
    prompt += ` Учти существующий заголовок в тексте, но создай более подходящий вариант.`;
  } else {
    prompt += ` Игнорируй любые существующие заголовки и сосредоточься только на содержании.`;
  }
  
  prompt += ` Верни только заголовок, без дополнительных объяснений:

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
      throw new Error(`OpenAI API ошибка: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const title = data.choices[0]?.message?.content?.trim();
    
    if (!title) {
      throw new Error('Не удалось получить заголовок от OpenAI');
    }
    
    // Очищаем заголовок от кавычек и лишних символов
    return title.replace(/^["']|["']$/g, '').trim();
    
  } catch (error) {
    console.error('Ошибка при генерации заголовка:', error);
    throw error;
  }
}

export function showNotice(message: string, duration: number = 5000) {
  new Notice(message, duration);
}
