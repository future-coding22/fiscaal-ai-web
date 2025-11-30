import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { db } from '@/lib/db';

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const { message, history, chatId } = await req.json();

  // Call tax service
  const res = await fetch(process.env.SERVICE_URL + '/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': process.env.SERVICE_API_KEY!,
    },
    body: JSON.stringify({ message, history }),
  });

  const data = await res.json();
  const response = data.response?.[0]?.text || data.response || 'Geen antwoord';

  // Save chat if user is logged in
  let savedChatId = chatId;
  if (session?.user?.id) {
    const messages = [...history, { role: 'user', content: message }, { role: 'assistant', content: response }];
    
    if (chatId) {
      await db.chat.update({
        where: { id: chatId },
        data: { messages: JSON.stringify(messages) },
      });
    } else {
      const chat = await db.chat.create({
        data: {
          userId: session.user.id,
          title: message.slice(0, 50),
          messages: JSON.stringify(messages),
        },
      });
      savedChatId = chat.id;
    }
  }

  return Response.json({ response, chatId: savedChatId });
}
