import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Get FAQ articles
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const languageId = searchParams.get('languageId');

    let query = supabase
      .from('faq_articles')
      .select('*')
      .eq('is_published', true)
      .order('helpful_count', { ascending: false });

    if (category) {
      query = query.eq('category', category);
    }

    if (languageId) {
      query = query.eq('language_id', languageId);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Filter by search if provided
    let results = data;
    if (search) {
      const searchLower = search.toLowerCase();
      results = data?.filter(
        (article) =>
          article.question.toLowerCase().includes(searchLower) ||
          article.answer.toLowerCase().includes(searchLower) ||
          article.keywords?.some((k) =>
            k.toLowerCase().includes(searchLower)
          )
      ) || [];
    }

    return NextResponse.json({ data: results }, { status: 200 });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return NextResponse.json(
      { error: 'Failed to fetch FAQ articles' },
      { status: 500 }
    );
  }
}

// Mark FAQ as helpful/unhelpful
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { articleId, helpful } = await request.json();

    const updateColumn = helpful ? 'helpful_count' : 'unhelpful_count';

    const { data, error } = await supabase
      .rpc('increment_faq_rating', {
        article_id: articleId,
        column_name: updateColumn,
      });

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Rating recorded' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error recording FAQ rating:', error);
    return NextResponse.json(
      { error: 'Failed to record rating' },
      { status: 500 }
    );
  }
}

