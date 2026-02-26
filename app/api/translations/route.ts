import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Get available languages
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from('languages')
      .select('id, code, name, display_name, direction')
      .eq('is_active', true)
      .order('display_name');

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching languages:', error);
    return NextResponse.json(
      { error: 'Failed to fetch languages' },
      { status: 500 }
    );
  }
}

// Get translations for a key
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { languageId, translationKey, context = 'ui' } = await request.json();

    const { data, error } = await supabase
      .from('translations')
      .select('translation_value')
      .eq('language_id', languageId)
      .eq('translation_key', translationKey)
      .eq('context', context)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json(
      {
        success: true,
        value: data?.translation_value || translationKey, // Return key as fallback
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching translation:', error);
    return NextResponse.json(
      { error: 'Failed to fetch translation' },
      { status: 500 }
    );
  }
}

// Set user language preference
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { languageId } = await request.json();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_language_preferences')
      .upsert(
        {
          user_id: user.id,
          preferred_language_id: languageId,
        },
        { onConflict: 'user_id' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, message: 'Language preference updated' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating language preference:', error);
    return NextResponse.json(
      { error: 'Failed to update preference' },
      { status: 500 }
    );
  }
}

// Get user's language preference
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('user_language_preferences')
      .select('languages(id, code, name, display_name)')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;

    return NextResponse.json(
      {
        data: data || null,
        defaultLanguageCode: 'en',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching language preference:', error);
    return NextResponse.json(
      { error: 'Failed to fetch preference' },
      { status: 500 }
    );
  }
}

