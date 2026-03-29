// src/pages/api/subscribe.ts
// Endpoint serverless para capturar emails con Resend
//
// SETUP:
// 1. npm install resend
// 2. Crea .env con: RESEND_API_KEY=re_xxxx
// 3. Activa SSR en astro.config.mjs:
//    output: 'hybrid'   (o 'server')
//    adapter: cloudflare()  ← npm install @astrojs/cloudflare

import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json();
    const email = body?.email?.trim().toLowerCase();

    if (!email || !email.includes('@')) {
      return new Response(JSON.stringify({ error: 'Email inválido' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const apiKey = import.meta.env.RESEND_API_KEY;

    if (!apiKey) {
      console.error('RESEND_API_KEY no configurada');
      return new Response(JSON.stringify({ error: 'Config error' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Añadir contacto a Resend Audience
    // Crea una Audience en resend.com/audiences y copia el ID
    const audienceId = import.meta.env.RESEND_AUDIENCE_ID;

    const res = await fetch(`https://api.resend.com/audiences/${audienceId}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        unsubscribed: false,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      console.error('Resend error:', err);
      throw new Error('Error al guardar en Resend');
    }

    // Email de bienvenida opcional
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Victorín <hola@victorinisimo.com>',
        to: [email],
        subject: 'Bienvenido/a al caos organizado 🧠',
        html: `
          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 2rem; color: #1A1714;">
            <p style="font-size: 1.25rem; font-weight: bold; margin-bottom: 1rem;">
              Ya estás dentro. ¡Bienvenido/a!
            </p>
            <p style="line-height: 1.7; margin-bottom: 1rem; color: #6B6560;">
              Me alegra que estés aquí. Esto es un espacio de escritura neurodivergente real:
              sin filtros, sin perfección, con fermentados y skincare coreano incluidos.
            </p>
            <p style="line-height: 1.7; margin-bottom: 2rem; color: #6B6560;">
              Recibirás noticias cuando publique algo nuevo. Sin spam, sin ruido.
            </p>
            <a href="https://victorinisimo.com" style="background: #1A1714; color: #F5F2EC; padding: 0.75rem 1.5rem; text-decoration: none; font-size: 0.875rem;">
              Leer el blog →
            </a>
          </div>
        `,
      }),
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Subscribe error:', error);
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
