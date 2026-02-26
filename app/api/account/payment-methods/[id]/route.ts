import { createClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: method } = await supabase
      .from('user_payment_methods')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!method || method.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { error } = await supabase
      .from('user_payment_methods')
      .delete()
      .eq('id', id)

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting payment method:', error)
    return NextResponse.json(
      { error: 'Failed to delete payment method' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const id = (await params).id
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify ownership
    const { data: method } = await supabase
      .from('user_payment_methods')
      .select('user_id')
      .eq('id', id)
      .single()

    if (!method || method.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { is_default, is_active } = body

    // If setting as default, unset others
    if (is_default) {
      await supabase
        .from('user_payment_methods')
        .update({ is_default: false })
        .eq('user_id', user.id)
    }

    const { data: updated, error } = await supabase
      .from('user_payment_methods')
      .update({
        is_default,
        is_active,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    return NextResponse.json({ method: updated })
  } catch (error) {
    console.error('Error updating payment method:', error)
    return NextResponse.json(
      { error: 'Failed to update payment method' },
      { status: 500 }
    )
  }
}
