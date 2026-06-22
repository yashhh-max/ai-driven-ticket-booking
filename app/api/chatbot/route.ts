import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// Helper function to write to local fallback conversation logs
function writeLocalLog(sessionId: string, userId: string, updatedMessages: any[]) {
  try {
    const logPath = path.join(process.cwd(), 'chatbot-logs.json');
    let logs: any[] = [];
    if (fs.existsSync(logPath)) {
      try {
        logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
      } catch (e) {
        logs = [];
      }
    }
    
    let index = logs.findIndex(log => log.session_id === sessionId && log.user_id === userId);
    if (index !== -1) {
      logs[index].messages = updatedMessages;
      logs[index].updated_at = new Date().toISOString();
    } else {
      logs.push({
        id: Math.random().toString(36).substr(2, 9),
        user_id: userId,
        session_id: sessionId,
        messages: updatedMessages,
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
    
    fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
  } catch (fsErr) {
    console.error('[Chatbot API] Failed to write local fallback log:', fsErr);
  }
}

// Chat message endpoint
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { sessionId, message, languageId } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get or create conversation
    let conversation = null;
    let conversationId = null;
    let isFallback = false;
    let messages: any[] = [];

    try {
      let { data, error: convError } = await supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .single();

      if (convError && convError.code === 'PGRST116') {
        // Create new conversation
        const { data: newConv, error: createError } = await supabase
          .from('chatbot_conversations')
          .insert({
            user_id: user.id,
            session_id: sessionId,
            messages: [],
          })
          .select()
          .single();

        if (createError) throw createError;
        conversation = newConv;
      } else if (convError) {
        throw convError;
      } else {
        conversation = data;
      }
      conversationId = conversation.id;
      messages = conversation.messages || [];
    } catch (dbErr: any) {
      console.warn('[Chatbot API] DB query failed, falling back to local JSON logs:', dbErr.message);
      isFallback = true;
      
      const logPath = path.join(process.cwd(), 'chatbot-logs.json');
      let logs: any[] = [];
      if (fs.existsSync(logPath)) {
        try {
          logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
        } catch (e) {
          logs = [];
        }
      }
      
      let localConv = logs.find(log => log.session_id === sessionId && log.user_id === user.id);
      if (!localConv) {
        localConv = {
          id: Math.random().toString(36).substr(2, 9),
          user_id: user.id,
          session_id: sessionId,
          messages: [],
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        logs.push(localConv);
        try {
          fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
        } catch (fsErr) {
          console.error('[Chatbot API] Failed writing initial local JSON:', fsErr);
        }
      }
      
      conversation = localConv;
      conversationId = localConv.id;
      messages = localConv.messages || [];
    }

    // Search FAQ for similar answers
    let faqArticles = null;
    try {
      const { data } = await supabase
        .from('faq_articles')
        .select('*')
        .eq('is_published', true);
      faqArticles = data;
    } catch (faqErr) {
      console.warn('[Chatbot API] FAQ DB query failed, using local fallback FAQs');
    }

    if (!faqArticles || faqArticles.length === 0) {
      // Local fallback FAQs
      faqArticles = [
        {
          id: 'faq-refund',
          question: 'How do I cancel my booking or request a ticket refund?',
          answer: 'You can cancel your booking and request a refund through your Account dashboard. Navigate to the "My Bookings" tab, find the ticket you wish to cancel, and click "Cancel Booking". If cancelled up to 2 hours before the movie showtime, a 100% refund will be instantly credited to your AuroSeat Wallet.',
          keywords: ['refund', 'cancel', 'cancellation', 'ticket', 'booking', 'money back'],
          is_published: true
        },
        {
          id: 'faq-loyalty',
          question: 'How does the loyalty rewards system work?',
          answer: 'Our Loyalty & Rewards program is designed to reward frequent moviegoers! For every ticket confirmation, you earn 10% value back in Loyalty Points. These points can be redeemed during checkout for direct discounts (10 loyalty points = ₹1). You can track your points balance, transaction history, and tier status (Bronze, Silver, Gold, Platinum) in the Wallet tab.',
          keywords: ['loyalty', 'rewards', 'points', 'redeem', 'discount', 'tier', 'member'],
          is_published: true
        },
        {
          id: 'faq-autobook',
          question: 'Can I setup auto-booking for upcoming movies?',
          answer: 'Yes! Our Smart Auto-Booking feature allows you to set preferences for upcoming releases. Simply specify your favorite theatres, movies, and timing constraints, and our AI scanner will automatically reserve the best seats for you the moment booking opens. Ensure your AuroSeat Wallet is sufficiently funded to trigger automatic booking.',
          keywords: ['auto-book', 'pre-booking', 'automatic', 'upcoming', 'wallet balance'],
          is_published: true
        },
        {
          id: 'faq-pricing',
          question: 'Why are ticket prices changing dynamically?',
          answer: 'AuroSeat uses an AI-powered Dynamic Pricing Engine to optimize showtime pricing. Prices adjust in real-time based on seat occupancy metrics, remaining hours until screening, and peak demand times. Book early to lock in early-bird rates before seats fill up!',
          keywords: ['pricing', 'price', 'dynamic', 'expensive', 'cost', 'occupancy'],
          is_published: true
        },
        {
          id: 'faq-sms',
          question: 'How do I receive SMS notifications?',
          answer: 'During the checkout process, simply check the "Opt-in for SMS notifications" box. We will send you instant, automated SMS alerts containing your booking reference, movie details, and digital ticket link upon successful payment confirmation.',
          keywords: ['sms', 'notification', 'phone', 'text', 'message', 'confirmation'],
          is_published: true
        }
      ];
    }

    // TF-IDF Cosine Similarity Semantic Matcher
    const matchedFAQ = computeTFIDFSimilarity(message, faqArticles);

    const botResponse = matchedFAQ
      ? matchedFAQ.answer
      : `I couldn't find a precise match for "${message}" in our FAQs. Here are a few common topics you can ask about:
• "How do I request a ticket refund?"
• "How does the loyalty rewards system work?"
• "Can I setup auto-booking for upcoming movies?"
• "What payment options are available?"

Would you like me to escalate this conversation to a human support agent?`;

    // Update conversation with new messages
    const updatedMessages = (messages || []).concat([
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'bot', content: botResponse, timestamp: new Date() },
    ]);

    if (!isFallback) {
      try {
        const { error: updateError } = await supabase
          .from('chatbot_conversations')
          .update({
            messages: updatedMessages,
            updated_at: new Date().toISOString(),
          })
          .eq('id', conversationId);

        if (updateError) throw updateError;
      } catch (dbErr: any) {
        console.warn('[Chatbot API] Failed updating DB conversation, writing to fallback log:', dbErr.message);
        writeLocalLog(sessionId, user.id, updatedMessages);
      }
    } else {
      writeLocalLog(sessionId, user.id, updatedMessages);
    }

    return NextResponse.json(
      {
        success: true,
        response: botResponse,
        conversationId: conversationId,
        matchedFAQ: matchedFAQ?.id || null,
        fallback: isFallback
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to process message', details: error.message || error },
      { status: 500 }
    );
  }
}

// Get conversation history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let conversations = [];
    try {
      let query = supabase
        .from('chatbot_conversations')
        .select('*')
        .eq('user_id', user.id);

      if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query.order('created_at', {
        ascending: false,
      });

      if (error) throw error;
      conversations = data || [];
    } catch (dbErr) {
      console.warn('[Chatbot API] GET DB fetch failed, using local fallback logs');
      const logPath = path.join(process.cwd(), 'chatbot-logs.json');
      if (fs.existsSync(logPath)) {
        try {
          const logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
          conversations = logs.filter((log: any) => {
            const matchUser = log.user_id === user.id;
            const matchSession = !sessionId || log.session_id === sessionId;
            return matchUser && matchSession;
          });
          conversations.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        } catch (e) {
          conversations = [];
        }
      }
    }

    return NextResponse.json({ data: conversations }, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations', details: error.message || error },
      { status: 500 }
    );
  }
}

// Escalate to human agent
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { conversationId, reason } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let success = false;
    try {
      const { error } = await supabase
        .from('chatbot_conversations')
        .update({
          status: 'escalated',
          updated_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('user_id', user.id);

      if (error) throw error;
      success = true;
    } catch (dbErr) {
      console.warn('[Chatbot API] PUT DB update failed, updating local fallback log');
      const logPath = path.join(process.cwd(), 'chatbot-logs.json');
      if (fs.existsSync(logPath)) {
        try {
          let logs = JSON.parse(fs.readFileSync(logPath, 'utf8'));
          let index = logs.findIndex((log: any) => log.id === conversationId && log.user_id === user.id);
          if (index !== -1) {
            logs[index].status = 'escalated';
            logs[index].updated_at = new Date().toISOString();
            fs.writeFileSync(logPath, JSON.stringify(logs, null, 2), 'utf8');
            success = true;
          }
        } catch (e) {
          console.error('[Chatbot API] Failed to escalate in fallback logs:', e);
        }
      }
    }

    return NextResponse.json(
      { success: success, message: success ? 'Escalated to support team' : 'Failed to escalate' },
      { status: success ? 200 : 500 }
    );
  } catch (error: any) {
    console.error('Escalation error:', error);
    return NextResponse.json(
      { error: 'Failed to escalate', details: error.message || error },
      { status: 500 }
    );
  }
}

// TF-IDF Similarity Matcher
function computeTFIDFSimilarity(query: string, documents: any[]): any {
  const cleanTokens = (text: string) => 
    text.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(w => w.length > 2);

  const queryTokens = cleanTokens(query);
  if (queryTokens.length === 0) return null;

  const docTokens = documents.map(doc => {
    const combinedText = `${doc.question} ${doc.answer} ${(doc.keywords || []).join(' ')}`;
    return {
      id: doc.id,
      doc,
      tokens: cleanTokens(combinedText)
    };
  });

  const df: Record<string, number> = {};
  queryTokens.forEach(term => {
    let count = 0;
    docTokens.forEach(d => {
      if (d.tokens.includes(term)) count++;
    });
    df[term] = count;
  });

  const queryTF: Record<string, number> = {};
  queryTokens.forEach(term => {
    queryTF[term] = (queryTF[term] || 0) + 1;
  });

  let bestDoc = null;
  let highestScore = 0;

  docTokens.forEach(d => {
    const docTF: Record<string, number> = {};
    d.tokens.forEach(term => {
      docTF[term] = (docTF[term] || 0) + 1;
    });

    let dotProduct = 0;
    let queryNormSq = 0;
    let docNormSq = 0;

    queryTokens.forEach(term => {
      const N = documents.length;
      const idf = Math.log(1 + N / (1 + (df[term] || 0)));
      
      const qWeight = queryTF[term] * idf;
      const dWeight = (docTF[term] || 0) * idf;

      dotProduct += qWeight * dWeight;
      queryNormSq += qWeight * qWeight;
      docNormSq += dWeight * dWeight;
    });

    if (queryNormSq > 0 && docNormSq > 0) {
      const score = dotProduct / (Math.sqrt(queryNormSq) * Math.sqrt(docNormSq));
      if (score > highestScore) {
        highestScore = score;
        bestDoc = d.doc;
      }
    }
  });

  console.log(`[Chatbot Semantic Matcher] Best score for "${query}": ${highestScore.toFixed(3)}`);
  
  if (highestScore > 0.15) {
    return bestDoc;
  }
  return null;
}
