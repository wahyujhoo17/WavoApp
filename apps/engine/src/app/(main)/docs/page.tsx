"use client";
import React from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronRight, 
  Copy, 
  Check, 
  MessageSquare, 
  LifeBuoy, 
  Terminal,
  Shield,
  Zap,
  Send,
  Key,
  Globe,
  FileText,
  BarChart3,
  Webhook,
  Server,
  Lock,
  Users,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

/* ─── Code Block ─── */
const CodeBlock = ({ language, code }: { language: string; code: string }) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[#0c0c0e] border border-white/[0.05] rounded-2xl overflow-hidden my-6 group">
      <div className="flex justify-between items-center px-5 py-3 bg-white/[0.03] border-b border-white/5">
        <div className="flex items-center gap-2.5">
          <Terminal size={14} className="text-[#8e8e93]" />
          <span className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">{language}</span>
        </div>
        <button 
          onClick={handleCopy}
          className="text-[#8e8e93] hover:text-white transition-colors flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider cursor-pointer"
        >
          {copied ? <Check size={14} className="text-[#34C759]" /> : <Copy size={14} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <div className="p-6 overflow-x-auto custom-scrollbar">
        <pre className="text-[13px] font-mono leading-relaxed text-[#a0a0a5] whitespace-pre">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
};

/* ─── Endpoint Row ─── */
const EndpointRow = ({ method, path, description, auth }: { method: string; path: string; description: string; auth?: string }) => {
  const methodColors: Record<string, string> = {
    GET: 'bg-[#34C759]/10 text-[#34C759] border-[#34C759]/20',
    POST: 'bg-[#cfbcff]/10 text-[#cfbcff] border-[#cfbcff]/20',
    PUT: 'bg-[#FFCC00]/10 text-[#FFCC00] border-[#FFCC00]/20',
    DELETE: 'bg-[#FF3B30]/10 text-[#FF3B30] border-[#FF3B30]/20',
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 p-4 rounded-2xl bg-black/20 border border-white/[0.04] hover:border-white/10 transition-all group">
      <div className="flex items-center gap-3 shrink-0">
        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-lg uppercase tracking-wider border ${methodColors[method] || 'bg-white/5 text-white border-white/10'}`}>
          {method}
        </span>
        <code className="text-[13px] font-mono font-bold text-white">{path}</code>
      </div>
      <div className="flex-1 flex items-center justify-between gap-3">
        <p className="text-[13px] text-[#8e8e93] font-medium">{description}</p>
        {auth && (
          <span className="text-[9px] font-bold px-2 py-0.5 bg-white/5 border border-white/10 rounded-md text-[#8e8e93] uppercase tracking-wider shrink-0">
            {auth}
          </span>
        )}
      </div>
    </div>
  );
};

/* ─── Sidebar Nav Item ─── */
const SideNavItem = ({ icon: Icon, label, id, isActive, onClick }: any) => (
  <button
    onClick={() => onClick(id)}
    className={`flex items-center gap-3 w-full px-4 py-2.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
      isActive 
        ? 'bg-[#cfbcff]/10 text-[#cfbcff] border border-[#cfbcff]/20' 
        : 'text-[#8e8e93] hover:text-white hover:bg-white/5 border border-transparent'
    }`}
  >
    <Icon size={16} />
    {label}
  </button>
);

/* ─── Info Box ─── */
const InfoBox = ({ title, children, variant = 'info' }: { title: string; children: React.ReactNode; variant?: 'info' | 'warning' | 'success' }) => {
  const styles = {
    info: { bg: 'bg-[#cfbcff]/10', border: 'border-[#cfbcff]/20', icon: 'text-[#cfbcff]' },
    warning: { bg: 'bg-[#FFCC00]/10', border: 'border-[#FFCC00]/20', icon: 'text-[#FFCC00]' },
    success: { bg: 'bg-[#34C759]/10', border: 'border-[#34C759]/20', icon: 'text-[#34C759]' },
  };
  const s = styles[variant];

  return (
    <div className={`${s.bg} border ${s.border} p-5 rounded-2xl flex gap-4`}>
      <div className={`w-10 h-10 rounded-full ${s.bg} flex items-center justify-center ${s.icon} shrink-0`}>
        <Zap size={20} />
      </div>
      <div className="space-y-1">
        <h4 className="text-[14px] font-bold text-white">{title}</h4>
        <div className="text-[13px] text-[#8e8e93] leading-relaxed">{children}</div>
      </div>
    </div>
  );
};

/* ─── Plan Limits Table ─── */
const PlanLimitsTable = () => (
  <div className="bg-[#1c1c1e] border border-white/[0.05] rounded-2xl overflow-hidden shadow-inner overflow-x-auto custom-scrollbar">
    <table className="w-full text-left min-w-[600px]">
      <thead>
        <tr className="border-b border-white/[0.05] bg-white/[0.02]">
          <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Feature</th>
          <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Free</th>
          <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Pro</th>
          <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Business</th>
          <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Enterprise</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-white/[0.02]">
        <tr>
          <td className="px-6 py-3.5 text-[13px] font-bold text-white">WhatsApp Instances</td>
          <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">1</td>
          <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">5</td>
          <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">20</td>
          <td className="px-6 py-3.5 text-[13px] text-[#cfbcff] font-bold">Unlimited</td>
        </tr>
        <tr>
          <td className="px-6 py-3.5 text-[13px] font-bold text-white">Daily Messages</td>
          <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">100</td>
          <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">5,000</td>
          <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">50,000</td>
          <td className="px-6 py-3.5 text-[13px] text-[#cfbcff] font-bold">Unlimited</td>
        </tr>
        <tr>
          <td className="px-6 py-3.5 text-[13px] font-bold text-white">Bulk Messaging</td>
          <td className="px-6 py-3.5 text-[13px] text-[#FF3B30]">✕</td>
          <td className="px-6 py-3.5 text-[13px] text-[#34C759]">✓</td>
          <td className="px-6 py-3.5 text-[13px] text-[#34C759]">✓</td>
          <td className="px-6 py-3.5 text-[13px] text-[#34C759]">✓</td>
        </tr>
        <tr>
          <td className="px-6 py-3.5 text-[13px] font-bold text-white">Max Bulk Recipients</td>
          <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">—</td>
          <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">500</td>
          <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">500</td>
          <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">500</td>
        </tr>
        <tr>
          <td className="px-6 py-3.5 text-[13px] font-bold text-white">Image Upload Limit</td>
          <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]" colSpan={4}>16 MB per file</td>
        </tr>
      </tbody>
    </table>
  </div>
);


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

const SECTIONS = [
  { id: 'getting-started', label: 'Getting Started', icon: Zap },
  { id: 'authentication', label: 'Authentication', icon: Shield },
  { id: 'services', label: 'WhatsApp Services', icon: Server },
  { id: 'messaging', label: 'Send Messages', icon: Send },
  { id: 'logs', label: 'Logs & Analytics', icon: BarChart3 },
  { id: 'webhooks', label: 'Webhooks', icon: Webhook },
  { id: 'api-keys', label: 'API Keys', icon: Key },
  { id: 'plan-limits', label: 'Plan & Limits', icon: Users },
  { id: 'errors', label: 'Error Handling', icon: FileText },
];

export default function DocumentationPage() {
  const [activeSection, setActiveSection] = React.useState('getting-started');

  const scrollTo = (id: string) => {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  /* ─── Code Snippets ─── */
  const curlLogin = `curl -X POST ${API_BASE_URL}/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{
    "email": "you@example.com",
    "password": "your_password"
  }'`;

  const loginResponse = `{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-user-id",
      "email": "you@example.com",
      "fullName": "John Doe",
      "role": "USER",
      "plan": "FREE"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}`;

  const curlSendText = `curl -X POST ${API_BASE_URL}/send/text \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <ACCESS_TOKEN or API_KEY>" \\
  -d '{
    "serviceId": "your-service-uuid",
    "to": "6281234567890",
    "message": "Hello from Wavo!",
    "options": {
      "typingDelay": true
    }
  }'`;

  const sendTextResponse = `{
  "success": true,
  "data": {
    "messageId": "uuid-message-id",
    "status": "QUEUED",
    "queuePosition": 1,
    "estimatedDelivery": "2026-05-22T15:30:05.000Z"
  }
}`;

  const curlSendBulk = `curl -X POST ${API_BASE_URL}/send/bulk \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -d '{
    "serviceId": "your-service-uuid",
    "recipients": ["6281234567890", "6289876543210"],
    "message": "Broadcast from Wavo!",
    "options": {
      "typingDelay": true,
      "interMessageDelay": 5
    }
  }'`;

  const curlSendImage = `curl -X POST ${API_BASE_URL}/send/image \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -F "serviceId=your-service-uuid" \\
  -F "to=6281234567890" \\
  -F "caption=Look at this photo!" \\
  -F "file=@/path/to/image.jpg"`;

  const curlCreateService = `curl -X POST ${API_BASE_URL}/services \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -d '{
    "name": "My Store WA",
    "webhookUrl": "https://yourdomain.com/webhook"
  }'`;

  const webhookPayloadExample = `{
  "event": "message.received",
  "payload": {
    "serviceId": "uuid-service-id",
    "from": "6281234567890",
    "body": "Hi, I need help!",
    "type": "text",
    "timestamp": "2026-05-22T15:30:00.000Z"
  },
  "timestamp": "2026-05-22T15:30:00.123Z"
}`;

  const webhookVerifyCode = `const crypto = require('crypto');

app.post('/webhook', express.json(), (req, res) => {
  const signature = req.headers['x-wavo-signature'];
  const event     = req.headers['x-wavo-event'];
  const secret    = process.env.WAVO_WEBHOOK_SECRET; // from Dashboard

  const payload = JSON.stringify(req.body);
  const computed = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex');

  if (signature === computed) {
    console.log('✓ Valid Wavo event:', event);
    // Process the webhook payload...
    res.status(200).send('OK');
  } else {
    console.log('✕ Invalid signature — rejecting');
    res.status(401).send('Unauthorized');
  }
});`;

  const curlCreateApiKey = `curl -X POST ${API_BASE_URL}/api-keys \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <ACCESS_TOKEN>" \\
  -d '{
    "serviceId": "your-service-uuid",
    "name": "Production Key"
  }'`;

  const apiKeyResponse = `{
  "success": true,
  "data": {
    "id": "uuid-key-id",
    "name": "Production Key",
    "scopes": ["send:message", "read:logs"],
    "apiKey": "wavo_sk_a1b2c3d4e5f6...",  ← shown ONCE
    "createdAt": "2026-05-22T15:30:00.000Z"
  }
}`;

  const errorResponseExample = `{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid messaging request parameters",
    "details": { ... }
  },
  "meta": {
    "requestId": "req-abc123",
    "timestamp": "2026-05-22T15:30:00.000Z"
  }
}`;

  return (
    <div className="flex min-h-screen">
      {/* ─── Left Sidebar Navigation ─── */}
      <div className="hidden lg:block w-[260px] border-r border-white/[0.05] p-6 shrink-0 h-screen sticky top-0 overflow-y-auto">
        <div className="space-y-2 mb-8">
          <h4 className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.2em] px-4 mb-4">API Reference</h4>
          {SECTIONS.map((s) => (
            <SideNavItem
              key={s.id}
              icon={s.icon}
              label={s.label}
              id={s.id}
              isActive={activeSection === s.id}
              onClick={scrollTo}
            />
          ))}
        </div>

        <div className="space-y-4 pt-6 border-t border-white/[0.05]">
          <h5 className="text-[11px] font-bold text-[#8e8e93] uppercase tracking-[0.2em] px-4">Resources</h5>
          <div className="space-y-2 px-4">
            <button className="flex items-center gap-3 text-[13px] font-bold text-[#8e8e93] hover:text-white transition-colors cursor-pointer">
              <MessageSquare size={16} />
              Community
            </button>
            <button className="flex items-center gap-3 text-[13px] font-bold text-[#8e8e93] hover:text-white transition-colors cursor-pointer">
              <LifeBuoy size={16} />
              Support
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div className="flex-1 max-w-[920px] p-6 md:p-12 mx-auto overflow-hidden">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-[12px] font-medium text-[#8e8e93] mb-8">
          <span>Wavo</span>
          <ChevronRight size={14} />
          <span className="text-white">API Documentation</span>
        </div>

        {/* Header */}
        <div className="space-y-4 mb-12">
          <h1 className="text-[36px] md:text-[48px] font-bold tracking-tight text-white leading-tight">
            Wavo API Reference
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#8e8e93] leading-relaxed max-w-[800px]">
            Complete guide to integrate with the Wavo WhatsApp Gateway Platform. Send messages, manage instances, configure webhooks, and monitor delivery — all via REST API.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[12px] font-bold text-[#8e8e93]">
              <Globe size={14} />
              Base URL: <code className="text-[#cfbcff] ml-1">{API_BASE_URL}</code>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[12px] font-bold text-[#8e8e93]">
              <Lock size={14} />
              Auth: <code className="text-[#cfbcff] ml-1">Bearer JWT / API Key</code>
            </div>
          </div>
        </div>

        {/* ════════════════ GETTING STARTED ════════════════ */}
        <section id="getting-started" className="space-y-6 mb-14">
          <h2 className="text-[26px] font-bold text-white border-b border-white/[0.05] pb-3">Getting Started</h2>
          <p className="text-[15px] text-[#8e8e93] leading-relaxed">
            Wavo is a self-hosted WhatsApp API Gateway built with Fastify, Baileys, BullMQ, PostgreSQL, and Redis. Follow these steps to start sending messages programmatically.
          </p>

          <div className="space-y-4">
            <div className="flex gap-4 p-5 rounded-2xl bg-black/20 border border-white/[0.04]">
              <div className="w-8 h-8 rounded-full bg-[#cfbcff]/10 flex items-center justify-center text-[#cfbcff] font-bold text-[13px] shrink-0">1</div>
              <div>
                <h4 className="text-[14px] font-bold text-white">Register an Account</h4>
                <p className="text-[13px] text-[#8e8e93] mt-1">Create a user account via <code className="bg-white/5 px-1.5 py-0.5 rounded text-[#cfbcff] text-[12px]">POST /api/v1/auth/register</code> or the Dashboard Register page.</p>
              </div>
            </div>
            <div className="flex gap-4 p-5 rounded-2xl bg-black/20 border border-white/[0.04]">
              <div className="w-8 h-8 rounded-full bg-[#cfbcff]/10 flex items-center justify-center text-[#cfbcff] font-bold text-[13px] shrink-0">2</div>
              <div>
                <h4 className="text-[14px] font-bold text-white">Create a WhatsApp Service Instance</h4>
                <p className="text-[13px] text-[#8e8e93] mt-1">Via <code className="bg-white/5 px-1.5 py-0.5 rounded text-[#cfbcff] text-[12px]">POST /api/v1/services</code> or the Dashboard. This represents a single WhatsApp device link.</p>
              </div>
            </div>
            <div className="flex gap-4 p-5 rounded-2xl bg-black/20 border border-white/[0.04]">
              <div className="w-8 h-8 rounded-full bg-[#cfbcff]/10 flex items-center justify-center text-[#cfbcff] font-bold text-[13px] shrink-0">3</div>
              <div>
                <h4 className="text-[14px] font-bold text-white">Connect & Scan QR Code</h4>
                <p className="text-[13px] text-[#8e8e93] mt-1">Hit <code className="bg-white/5 px-1.5 py-0.5 rounded text-[#cfbcff] text-[12px]">POST /api/v1/services/:id/connect</code> or use the Dashboard to scan the QR code with your WhatsApp mobile app.</p>
              </div>
            </div>
            <div className="flex gap-4 p-5 rounded-2xl bg-black/20 border border-white/[0.04]">
              <div className="w-8 h-8 rounded-full bg-[#cfbcff]/10 flex items-center justify-center text-[#cfbcff] font-bold text-[13px] shrink-0">4</div>
              <div>
                <h4 className="text-[14px] font-bold text-white">Send Your First Message</h4>
                <p className="text-[13px] text-[#8e8e93] mt-1">Use <code className="bg-white/5 px-1.5 py-0.5 rounded text-[#cfbcff] text-[12px]">POST /api/v1/send/text</code> with your JWT or API Key to send a WhatsApp message.</p>
              </div>
            </div>
          </div>

          <InfoBox title="Environment Configuration" variant="info">
            <p>Configure the following in your <code className="bg-white/5 px-1.5 py-0.5 rounded text-[#cfbcff]">.env</code> file:</p>
            <ul className="list-disc list-inside mt-2 space-y-1 text-[12px]">
              <li><code className="text-[#cfbcff]">DATABASE_URL</code> — PostgreSQL connection string</li>
              <li><code className="text-[#cfbcff]">REDIS_URL</code> — Redis connection for BullMQ queues (default: <code className="text-white">redis://localhost:6379</code>)</li>
              <li><code className="text-[#cfbcff]">PORT</code> — API server port (default: <code className="text-white">4000</code>)</li>
              <li><code className="text-[#cfbcff]">FRONTEND_URL</code> — Dashboard URL (default: <code className="text-white">http://localhost:3001</code>)</li>
              <li><code className="text-[#cfbcff]">JWT_PRIVATE_KEY</code> — Secret key for signing JWT tokens</li>
              <li><code className="text-[#cfbcff]">ENCRYPTION_KEY</code> — 32-character AES-256-GCM key for credential encryption</li>
            </ul>
          </InfoBox>
        </section>

        {/* ════════════════ AUTHENTICATION ════════════════ */}
        <section id="authentication" className="space-y-6 mb-14">
          <h2 className="text-[26px] font-bold text-white border-b border-white/[0.05] pb-3">Authentication</h2>
          <p className="text-[15px] text-[#8e8e93] leading-relaxed">
            Wavo uses JWT (JSON Web Tokens) with Refresh Token Rotation for session authentication. API Keys are also supported for programmatic server-to-server access on messaging endpoints.
          </p>

          <div className="space-y-3">
            <EndpointRow method="POST" path="/api/v1/auth/register" description="Create a new user account" />
            <EndpointRow method="POST" path="/api/v1/auth/login" description="Sign in and receive JWT + refresh token" />
            <EndpointRow method="POST" path="/api/v1/auth/refresh" description="Rotate refresh token and get a new access token" />
            <EndpointRow method="POST" path="/api/v1/auth/logout" description="Revoke session (optional: all devices)" auth="JWT" />
            <EndpointRow method="PUT" path="/api/v1/auth/profile" description="Update user profile (fullName, email)" auth="JWT" />
            <EndpointRow method="GET" path="/api/v1/auth/usage" description="Get resource usage stats (messages, requests, daily)" auth="JWT" />
          </div>

          <h3 className="text-[18px] font-bold text-white pt-4">Login Example</h3>
          <CodeBlock language="cURL" code={curlLogin} />
          <h4 className="text-[14px] font-bold text-[#8e8e93] uppercase tracking-wider">Response</h4>
          <CodeBlock language="JSON" code={loginResponse} />

          <InfoBox title="Refresh Token Rotation (RTR)" variant="warning">
            <p>
              Every time you call <code className="text-[#cfbcff]">POST /auth/refresh</code>, the old refresh token is immediately revoked and a new pair is issued.
              If a previously revoked token is reused, <strong>all sessions in that token family are terminated</strong> as a security measure against token replay attacks.
            </p>
          </InfoBox>

          <div className="space-y-2">
            <h4 className="text-[15px] font-bold text-white">Using Tokens</h4>
            <p className="text-[14px] text-[#8e8e93] leading-relaxed">
              Include the access token in the <code className="bg-white/5 px-1.5 py-0.5 rounded text-[#cfbcff]">Authorization</code> header for all authenticated requests:
            </p>
            <CodeBlock language="HTTP Header" code={`Authorization: Bearer eyJhbGciOiJIUzI1NiIs...`} />
            <p className="text-[13px] text-[#8e8e93]">
              Access tokens expire after <strong>15 minutes</strong> (configurable via <code className="text-[#cfbcff]">JWT_ACCESS_EXPIRY</code>). Refresh tokens expire after <strong>7 days</strong>.
            </p>
          </div>
        </section>

        {/* ════════════════ SERVICES ════════════════ */}
        <section id="services" className="space-y-6 mb-14">
          <h2 className="text-[26px] font-bold text-white border-b border-white/[0.05] pb-3">WhatsApp Services</h2>
          <p className="text-[15px] text-[#8e8e93] leading-relaxed">
            A WhatsApp Service represents a single linked WhatsApp device. You can manage multiple instances depending on your plan tier.
          </p>

          <div className="space-y-3">
            <EndpointRow method="GET" path="/api/v1/services" description="List all active WhatsApp instances" auth="JWT" />
            <EndpointRow method="GET" path="/api/v1/services/:id" description="Get instance details including webhooks & API keys" auth="JWT" />
            <EndpointRow method="POST" path="/api/v1/services" description="Create a new WhatsApp service instance" auth="JWT" />
            <EndpointRow method="POST" path="/api/v1/services/:id/connect" description="Initiate connection (triggers QR code generation)" auth="JWT" />
            <EndpointRow method="POST" path="/api/v1/services/:id/disconnect" description="Disconnect the active WhatsApp session" auth="JWT" />
            <EndpointRow method="DELETE" path="/api/v1/services/:id" description="Soft-delete the service and destroy session credentials" auth="JWT" />
          </div>

          <h3 className="text-[18px] font-bold text-white pt-4">Create Service</h3>
          <CodeBlock language="cURL" code={curlCreateService} />

          <InfoBox title="Real-time QR via WebSocket" variant="info">
            <p>
              After calling <code className="text-[#cfbcff]">POST /services/:id/connect</code>, listen for QR codes in real-time via Socket.IO.
              Join room <code className="text-[#cfbcff]">service:{'<serviceId>'}</code> and listen to the <code className="text-[#cfbcff]">service:qr</code> event.
              WebSocket URL: <code className="text-white">{API_BASE_URL}</code>
            </p>
          </InfoBox>
        </section>

        {/* ════════════════ MESSAGING ════════════════ */}
        <section id="messaging" className="space-y-6 mb-14">
          <h2 className="text-[26px] font-bold text-white border-b border-white/[0.05] pb-3">Send Messages</h2>
          <p className="text-[15px] text-[#8e8e93] leading-relaxed">
            Send WhatsApp messages through the REST API. Messages are enqueued via BullMQ for reliable, rate-limited delivery. All messaging endpoints support both JWT and API Key authentication.
          </p>

          <div className="space-y-3">
            <EndpointRow method="POST" path="/api/v1/send/text" description="Send a text message to a single recipient" auth="JWT / API Key" />
            <EndpointRow method="POST" path="/api/v1/send/bulk" description="Send a broadcast to up to 500 recipients (Paid plans only)" auth="JWT / API Key" />
            <EndpointRow method="POST" path="/api/v1/send/image" description="Send an image with optional caption (multipart/form-data)" auth="JWT / API Key" />
          </div>

          <h3 className="text-[18px] font-bold text-white pt-4">Send Text Message</h3>
          <CodeBlock language="cURL" code={curlSendText} />
          <h4 className="text-[14px] font-bold text-[#8e8e93] uppercase tracking-wider">Response (HTTP 202 Accepted)</h4>
          <CodeBlock language="JSON" code={sendTextResponse} />

          <h3 className="text-[18px] font-bold text-white pt-6">Send Bulk Broadcast</h3>
          <CodeBlock language="cURL" code={curlSendBulk} />

          <h3 className="text-[18px] font-bold text-white pt-6">Send Image</h3>
          <CodeBlock language="cURL" code={curlSendImage} />

          <InfoBox title="Phone Number Format" variant="warning">
            <p>
              Phone numbers must be in <strong>E.164 digits-only</strong> format (10–15 digits, no <code className="text-[#cfbcff]">+</code> prefix).
              Example: <code className="text-white">6281234567890</code> (Indonesia), <code className="text-white">14155552671</code> (US).
            </p>
          </InfoBox>
        </section>

        {/* ════════════════ LOGS & ANALYTICS ════════════════ */}
        <section id="logs" className="space-y-6 mb-14">
          <h2 className="text-[26px] font-bold text-white border-b border-white/[0.05] pb-3">Logs & Analytics</h2>
          <p className="text-[15px] text-[#8e8e93] leading-relaxed">
            Monitor message delivery status and throughput metrics. Logs use cursor-based pagination for high-performance retrieval.
          </p>

          <div className="space-y-3">
            <EndpointRow method="GET" path="/api/v1/logs" description="Retrieve message logs with cursor pagination" auth="JWT" />
            <EndpointRow method="GET" path="/api/v1/analytics" description="Get outbound/inbound stats and success rate" auth="JWT" />
          </div>

          <h3 className="text-[18px] font-bold text-white pt-4">Query Parameters — Logs</h3>
          <div className="bg-[#1c1c1e] border border-white/[0.05] rounded-2xl overflow-hidden overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Param</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Type</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                <tr>
                  <td className="px-6 py-3.5"><code className="text-[12px] text-[#cfbcff]">serviceId</code></td>
                  <td className="px-6 py-3.5 text-[12px] text-[#8e8e93]">UUID <span className="text-[#FF3B30]">*</span></td>
                  <td className="px-6 py-3.5 text-[12px] text-[#8e8e93]">WhatsApp Service to query logs for</td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5"><code className="text-[12px] text-[#cfbcff]">status</code></td>
                  <td className="px-6 py-3.5 text-[12px] text-[#8e8e93]">enum</td>
                  <td className="px-6 py-3.5 text-[12px] text-[#8e8e93]">QUEUED, PROCESSING, SENT, DELIVERED, READ, FAILED</td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5"><code className="text-[12px] text-[#cfbcff]">direction</code></td>
                  <td className="px-6 py-3.5 text-[12px] text-[#8e8e93]">enum</td>
                  <td className="px-6 py-3.5 text-[12px] text-[#8e8e93]">INBOUND or OUTBOUND</td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5"><code className="text-[12px] text-[#cfbcff]">limit</code></td>
                  <td className="px-6 py-3.5 text-[12px] text-[#8e8e93]">number</td>
                  <td className="px-6 py-3.5 text-[12px] text-[#8e8e93]">1–100, default 50</td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5"><code className="text-[12px] text-[#cfbcff]">cursor</code></td>
                  <td className="px-6 py-3.5 text-[12px] text-[#8e8e93]">string</td>
                  <td className="px-6 py-3.5 text-[12px] text-[#8e8e93]">Cursor ID from previous response for pagination</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ════════════════ WEBHOOKS ════════════════ */}
        <section id="webhooks" className="space-y-6 mb-14">
          <h2 className="text-[26px] font-bold text-white border-b border-white/[0.05] pb-3">Webhooks</h2>
          <p className="text-[15px] text-[#8e8e93] leading-relaxed">
            Receive real-time HTTP POST notifications when events occur — incoming messages, delivery status changes, and instance connection updates. 
            Payloads are signed with HMAC SHA-256 using your unique Signing Secret.
          </p>

          <div className="space-y-3">
            <EndpointRow method="GET" path="/api/v1/webhooks?serviceId=..." description="Get webhook config for a service" auth="JWT" />
            <EndpointRow method="POST" path="/api/v1/webhooks" description="Create or update webhook configuration" auth="JWT" />
            <EndpointRow method="POST" path="/api/v1/webhooks/test" description="Send a test ping payload to your endpoint" auth="JWT" />
            <EndpointRow method="GET" path="/api/v1/webhooks/:id/deliveries" description="View delivery logs for a webhook" auth="JWT" />
          </div>

          <h3 className="text-[18px] font-bold text-white pt-4">Available Events</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { key: 'message.received', desc: 'Incoming message from a contact' },
              { key: 'message.sent', desc: 'Outgoing message successfully sent' },
              { key: 'message.failed', desc: 'Outgoing message failed to deliver' },
              { key: 'instance.connected', desc: 'WhatsApp instance connected' },
              { key: 'instance.disconnected', desc: 'WhatsApp instance disconnected' },
            ].map((evt) => (
              <div key={evt.key} className="flex items-start gap-3 p-4 rounded-2xl bg-black/20 border border-white/[0.04]">
                <div className="w-2 h-2 rounded-full bg-[#cfbcff] mt-1.5 shrink-0" />
                <div>
                  <code className="text-[12px] font-mono font-bold text-white">{evt.key}</code>
                  <p className="text-[11px] text-[#8e8e93] mt-0.5">{evt.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <h3 className="text-[18px] font-bold text-white pt-6">Payload Structure</h3>
          <p className="text-[14px] text-[#8e8e93]">Each delivery includes these HTTP headers:</p>
          <div className="space-y-2 my-4">
            <div className="flex gap-3 items-center text-[13px]">
              <code className="bg-white/5 px-2 py-1 rounded-lg text-[#cfbcff] font-mono text-[12px]">X-Wavo-Signature</code>
              <span className="text-[#8e8e93]">— HMAC SHA-256 hex digest of the JSON body</span>
            </div>
            <div className="flex gap-3 items-center text-[13px]">
              <code className="bg-white/5 px-2 py-1 rounded-lg text-[#cfbcff] font-mono text-[12px]">X-Wavo-Event</code>
              <span className="text-[#8e8e93]">— Event type (e.g. <code className="text-white">message.received</code>)</span>
            </div>
            <div className="flex gap-3 items-center text-[13px]">
              <code className="bg-white/5 px-2 py-1 rounded-lg text-[#cfbcff] font-mono text-[12px]">User-Agent</code>
              <span className="text-[#8e8e93]">— <code className="text-white">Wavo-Webhook-Dispatcher/3.0</code></span>
            </div>
          </div>
          <CodeBlock language="JSON — Webhook Payload" code={webhookPayloadExample} />

          <h3 className="text-[18px] font-bold text-white pt-6">Verifying Signatures</h3>
          <p className="text-[14px] text-[#8e8e93] leading-relaxed">
            Always verify the <code className="bg-white/5 px-1.5 py-0.5 rounded text-[#cfbcff]">X-Wavo-Signature</code> header against the payload body using your Signing Secret to confirm authenticity.
          </p>
          <CodeBlock language="Node.js (Express)" code={webhookVerifyCode} />

          <h3 className="text-[18px] font-bold text-white pt-6">Expected Responses</h3>
          <div className="bg-[#1c1c1e] border border-white/[0.05] rounded-2xl overflow-hidden overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Status Code</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Meaning</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                <tr>
                  <td className="px-6 py-3.5"><span className="text-[11px] font-bold px-2.5 py-1 bg-[#34C759]/10 text-[#34C759] border border-[#34C759]/20 rounded-lg">2xx</span></td>
                  <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">Delivery acknowledged. No retries.</td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5"><span className="text-[11px] font-bold px-2.5 py-1 bg-[#FFCC00]/10 text-[#FFCC00] border border-[#FFCC00]/20 rounded-lg">4xx</span></td>
                  <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">Client error — BullMQ will retry with backoff.</td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5"><span className="text-[11px] font-bold px-2.5 py-1 bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 rounded-lg">5xx</span></td>
                  <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">Server failure — BullMQ will retry automatically.</td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5"><span className="text-[11px] font-bold px-2.5 py-1 bg-[#FF3B30]/10 text-[#FF3B30] border border-[#FF3B30]/20 rounded-lg">Timeout</span></td>
                  <td className="px-6 py-3.5 text-[13px] text-[#8e8e93]">10-second timeout per delivery attempt. Treated as failure.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* ════════════════ API KEYS ════════════════ */}
        <section id="api-keys" className="space-y-6 mb-14">
          <h2 className="text-[26px] font-bold text-white border-b border-white/[0.05] pb-3">API Keys</h2>
          <p className="text-[15px] text-[#8e8e93] leading-relaxed">
            API Keys provide server-to-server authentication for the messaging endpoints without requiring JWT session tokens. Each key is scoped to a specific WhatsApp Service instance.
          </p>

          <div className="space-y-3">
            <EndpointRow method="GET" path="/api/v1/api-keys" description="List all active API keys for the authenticated user" auth="JWT" />
            <EndpointRow method="POST" path="/api/v1/api-keys" description="Generate a new API key for a specific service" auth="JWT" />
            <EndpointRow method="DELETE" path="/api/v1/api-keys/:id" description="Revoke (deactivate) an API key" auth="JWT" />
          </div>

          <h3 className="text-[18px] font-bold text-white pt-4">Create API Key</h3>
          <CodeBlock language="cURL" code={curlCreateApiKey} />
          <h4 className="text-[14px] font-bold text-[#8e8e93] uppercase tracking-wider">Response</h4>
          <CodeBlock language="JSON" code={apiKeyResponse} />

          <InfoBox title="API Key Security" variant="warning">
            <p>
              The full API key (starting with <code className="text-[#cfbcff]">wavo_sk_</code>) is displayed <strong>only once</strong> at creation time. 
              Store it securely — it cannot be retrieved again. Only the key prefix is stored in the database for identification.
            </p>
          </InfoBox>

          <div className="space-y-2 pt-4">
            <h4 className="text-[15px] font-bold text-white">Using API Keys</h4>
            <p className="text-[14px] text-[#8e8e93] leading-relaxed">
              Pass the API key as a Bearer token in the <code className="bg-white/5 px-1.5 py-0.5 rounded text-[#cfbcff]">Authorization</code> header. The server auto-detects the <code className="text-[#cfbcff]">wavo_sk_</code> prefix to route to API Key validation:
            </p>
            <CodeBlock language="HTTP Header" code={`Authorization: Bearer wavo_sk_a1b2c3d4e5f6...`} />
            <p className="text-[13px] text-[#8e8e93]">
              Default scopes granted: <code className="text-[#cfbcff]">send:message</code>, <code className="text-[#cfbcff]">read:logs</code>
            </p>
          </div>
        </section>

        {/* ════════════════ PLAN LIMITS ════════════════ */}
        <section id="plan-limits" className="space-y-6 mb-14">
          <h2 className="text-[26px] font-bold text-white border-b border-white/[0.05] pb-3">Plan & Limits</h2>
          <p className="text-[15px] text-[#8e8e93] leading-relaxed">
            Resource limits are enforced per plan tier. New accounts default to the <strong>FREE</strong> plan.
          </p>
          <PlanLimitsTable />
          <InfoBox title="Exceeding Limits" variant="warning">
            <p>
              When you exceed your daily message quota, the API returns <code className="text-[#cfbcff]">HTTP 403</code> with error code <code className="text-[#cfbcff]">PLAN_LIMIT_EXCEEDED</code>.
              Upgrade your plan via the Dashboard Settings page.
            </p>
          </InfoBox>
        </section>

        {/* ════════════════ ERROR HANDLING ════════════════ */}
        <section id="errors" className="space-y-6 mb-14">
          <h2 className="text-[26px] font-bold text-white border-b border-white/[0.05] pb-3">Error Handling</h2>
          <p className="text-[15px] text-[#8e8e93] leading-relaxed">
            All API responses follow a consistent envelope format. On errors, <code className="bg-white/5 px-1.5 py-0.5 rounded text-[#cfbcff]">success</code> is always <code className="text-[#FF3B30]">false</code>.
          </p>
          <CodeBlock language="JSON — Error Response" code={errorResponseExample} />

          <h3 className="text-[18px] font-bold text-white pt-4">Error Codes Reference</h3>
          <div className="bg-[#1c1c1e] border border-white/[0.05] rounded-2xl overflow-hidden overflow-x-auto custom-scrollbar">
            <table className="w-full text-left min-w-[500px]">
              <thead>
                <tr className="border-b border-white/[0.05] bg-white/[0.02]">
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Code</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">HTTP</th>
                  <th className="px-6 py-4 text-[11px] font-bold text-[#8e8e93] uppercase tracking-widest">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {[
                  ['VALIDATION_ERROR', '400', 'Invalid request body or query parameters'],
                  ['UNAUTHORIZED', '401', 'Missing, expired, or invalid authentication token'],
                  ['TOKEN_EXPIRED', '401', 'Refresh token has expired or been revoked'],
                  ['INVALID_API_KEY', '401', 'API key not found, inactive, or malformed'],
                  ['FORBIDDEN', '403', 'Action not allowed on your current plan'],
                  ['PLAN_LIMIT_EXCEEDED', '403', 'Daily quota or instance limit reached'],
                  ['NOT_FOUND', '404', 'Resource (service, webhook, key) does not exist'],
                  ['CONFLICT', '409', 'Duplicate resource (e.g. email already registered)'],
                  ['INSTANCE_NOT_CONNECTED', '422', 'WhatsApp service is not connected — scan QR first'],
                  ['WHATSAPP_ERROR', '500', 'Upstream Baileys/WhatsApp internal error'],
                  ['INTERNAL_ERROR', '500', 'Unexpected server error'],
                ].map(([code, http, desc]) => (
                  <tr key={code}>
                    <td className="px-6 py-3"><code className="text-[12px] font-mono text-[#cfbcff]">{code}</code></td>
                    <td className="px-6 py-3 text-[12px] text-[#8e8e93]">{http}</td>
                    <td className="px-6 py-3 text-[12px] text-[#8e8e93]">{desc}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ─── Health Checks ─── */}
        <section className="space-y-6 mb-14">
          <h2 className="text-[26px] font-bold text-white border-b border-white/[0.05] pb-3">Health Checks</h2>
          <div className="space-y-3">
            <EndpointRow method="GET" path="/healthz" description="Liveness check — returns uptime" />
            <EndpointRow method="GET" path="/readyz" description="Readiness check — validates database connectivity" />
          </div>
        </section>

        {/* ─── Footer ─── */}
        <div className="pt-10 border-t border-white/[0.05] mt-12 mb-8">
          <div className="flex flex-wrap items-center gap-6 text-[13px] text-[#8e8e93]">
            <span className="font-bold text-white">Wavo API v1</span>
            <span>•</span>
            <span>Backend: <code className="text-[#cfbcff]">{API_BASE_URL}</code></span>
            <span>•</span>
            <span>Dashboard: <code className="text-[#cfbcff]">This site</code></span>
          </div>
        </div>
      </div>
    </div>
  );
}
