import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import handlebars from 'handlebars';

// Initialize email transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

// Send email notification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    const { userId, templateName, variables, email } = await request.json();

    // Get template
    const { data: template, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('name', templateName)
      .single();

    if (templateError || !template) {
      return NextResponse.json(
        { error: 'Email template not found' },
        { status: 404 }
      );
    }

    // Compile template with variables
    const htmlTemplate = handlebars.compile(template.template_html);
    const textTemplate = template.template_text
      ? handlebars.compile(template.template_text)
      : null;

    const htmlBody = htmlTemplate(variables);
    const textBody = textTemplate ? textTemplate(variables) : undefined;
    const subject = handlebars.compile(template.subject)(variables);

    // Send email
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: email,
      subject,
      html: htmlBody,
      text: textBody,
    });

    // Record notification
    const { data, error: recordError } = await supabase
      .from('email_notifications')
      .insert({
        user_id: userId,
        email,
        template_id: template.id,
        template_name: templateName,
        subject,
        body: htmlBody,
        variables,
        status: 'sent',
        sent_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (recordError) throw recordError;

    return NextResponse.json(
      {
        success: true,
        message: 'Email sent successfully',
        notificationId: data.id,
        messageId: info.messageId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Email sending error:', error);

    // Record failed notification
    const { userId, templateName, variables, email } = await request.json();
    await supabase
      .from('email_notifications')
      .insert({
        user_id: userId,
        email,
        template_name: templateName,
        subject: 'Email Sending Failed',
        variables,
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error',
      });

    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Get notification history
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json({ data }, { status: 200 });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}

// Create email template (admin only)
export async function PUT(request: NextRequest) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Check if admin
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user?.id)
      .single();

    if (profile?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can create templates' },
        { status: 403 }
      );
    }

    const {
      name,
      subject,
      template_html,
      template_text,
      variables,
    } = await request.json();

    const { data, error } = await supabase
      .from('email_templates')
      .upsert(
        {
          name,
          subject,
          template_html,
          template_text,
          variables,
        },
        { onConflict: 'name' }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(
      { success: true, templateId: data.id },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}

