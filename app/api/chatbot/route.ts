import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

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
    let { data: conversation, error: convError } = await supabase
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
    }

    // Search FAQ for similar answers
    const { data: faqArticles } = await supabase
      .from('faq_articles')
      .select('*')
      .eq('is_published', true)
      .limit(5);

    // Simple keyword matching (in production, use semantic search)
    const keywords = message.toLowerCase().split(' ');
    const matchedFAQ = faqArticles?.filter((article) =>
      keywords.some(
        (k) =>
          article.question.toLowerCase().includes(k) ||
          article.keywords?.some((kw) => kw.toLowerCase().includes(k))
      )
    )?.[0];

    const botResponse = matchedFAQ
      ? matchedFAQ.answer
      : "I'm not sure about that. Please contact our support team for assistance.";

    // Update conversation with new messages
    const updatedMessages = (conversation.messages || []).concat([
      { role: 'user', content: message, timestamp: new Date() },
      { role: 'bot', content: botResponse, timestamp: new Date() },
    ]);

    const { data: updatedConv, error: updateError } = await supabase
      .from('chatbot_conversations')
      .update({
        messages: updatedMessages,
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversation.id)
      .select()
      .single();

    if (updateError) throw updateError;

    return NextResponse.json(
      {
        success: true,
        response: botResponse,
        conversationId: conversation.id,
        matchedFAQ: matchedFAQ?.id || null,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Chatbot error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
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

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
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

    const { data, error } = await supabase
      .from('chatbot_conversations')
      .update({
        status: 'escalated',
        updated_at: new Date().toISOString(),
      })
      .eq('id', conversationId)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;

    // Send notification to support team
    // Implementation depends on your notification system

    return NextResponse.json(
      { success: true, message: 'Escalated to support team' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Escalation error:', error);
    return NextResponse.json(
      { error: 'Failed to escalate' },
      { status: 500 }
    );
  }
}

