import fetch from 'node-fetch';

const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID || '';
const TELEGRAM_API_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

export interface TelegramMessage {
  text: string;
  parse_mode?: 'HTML' | 'Markdown';
  disable_web_page_preview?: boolean;
}

export interface OrderNotification {
  orderId: string;
  serviceName: string;
  clientName: string;
  clientEmail: string;
  clientPhone?: string;
  companyName?: string;
  projectDescription: string;
  budget: string;
  timeline: string;
  createdAt: Date;
}

export async function sendMessage(message: TelegramMessage): Promise<boolean> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn('Telegram bot not configured - message not sent');
    return false;
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        ...message
      }),
    });

    const result = await response.json() as any;
    
    if (!result.ok) {
      console.error('Telegram API error:', result.description);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to send Telegram message:', error);
    return false;
  }
}

export async function sendOrderNotification(order: OrderNotification, language: 'uz' | 'en' = 'uz'): Promise<boolean> {
  const isUzbek = language === 'uz';
  
  const message = isUzbek
    ? `🔔 <b>Yangi buyurtma!</b>

📋 <b>Buyurtma ID:</b> ${order.orderId}
🔧 <b>Xizmat:</b> ${order.serviceName}

👤 <b>Mijoz ma'lumotlari:</b>
• <b>Ism:</b> ${order.clientName}
• <b>Email:</b> ${order.clientEmail}
${order.clientPhone ? `• <b>Telefon:</b> ${order.clientPhone}` : ''}
${order.companyName ? `• <b>Kompaniya:</b> ${order.companyName}` : ''}

📝 <b>Loyiha tavsifi:</b>
${order.projectDescription}

💰 <b>Byudjet:</b> ${order.budget}
⏰ <b>Muddat:</b> ${order.timeline}

📅 <b>Sana:</b> ${order.createdAt.toLocaleDateString('uz-UZ')} ${order.createdAt.toLocaleTimeString('uz-UZ')}`
    : `🔔 <b>New Order!</b>

📋 <b>Order ID:</b> ${order.orderId}
🔧 <b>Service:</b> ${order.serviceName}

👤 <b>Client Information:</b>
• <b>Name:</b> ${order.clientName}
• <b>Email:</b> ${order.clientEmail}
${order.clientPhone ? `• <b>Phone:</b> ${order.clientPhone}` : ''}
${order.companyName ? `• <b>Company:</b> ${order.companyName}` : ''}

📝 <b>Project Description:</b>
${order.projectDescription}

💰 <b>Budget:</b> ${order.budget}
⏰ <b>Timeline:</b> ${order.timeline}

📅 <b>Date:</b> ${order.createdAt.toLocaleDateString('en-US')} ${order.createdAt.toLocaleTimeString('en-US')}`;

  return await sendMessage({
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
}

export async function sendBlogNotification(
  title: string, 
  slug: string, 
  category: string,
  language: 'uz' | 'en' = 'uz'
): Promise<boolean> {
  const isUzbek = language === 'uz';
  const blogUrl = `${process.env.REPLIT_DOMAIN || 'https://evolvo-uz.com'}/blog/${slug}`;
  
  const message = isUzbek
    ? `📝 <b>Yangi blog maqolasi!</b>

📰 <b>Sarlavha:</b> ${title}
🏷️ <b>Kategoriya:</b> ${category}

🔗 <b>Maqolani o'qish:</b> ${blogUrl}

#Evolvo #AI #Blog`
    : `📝 <b>New Blog Post!</b>

📰 <b>Title:</b> ${title}
🏷️ <b>Category:</b> ${category}

🔗 <b>Read article:</b> ${blogUrl}

#Evolvo #AI #Blog`;

  return await sendMessage({
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: false
  });
}

export async function sendSystemAlert(
  alert: string,
  type: 'info' | 'warning' | 'error' = 'info'
): Promise<boolean> {
  const emojis = {
    info: 'ℹ️',
    warning: '⚠️',
    error: '🚨'
  };
  
  const message = `${emojis[type]} <b>System Alert</b>

${alert}

<i>Time: ${new Date().toISOString()}</i>`;

  return await sendMessage({
    text: message,
    parse_mode: 'HTML',
    disable_web_page_preview: true
  });
}

export async function testTelegramConnection(): Promise<{ success: boolean; botInfo?: any; error?: string }> {
  if (!TELEGRAM_BOT_TOKEN) {
    return { success: false, error: 'Bot token not configured' };
  }

  try {
    const response = await fetch(`${TELEGRAM_API_URL}/getMe`);
    const result = await response.json() as any;
    
    if (result.ok) {
      return { success: true, botInfo: result.result };
    } else {
      return { success: false, error: result.description };
    }
  } catch (error) {
    return { success: false, error: (error as Error).message };
  }
}