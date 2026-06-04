'use client'

import { useEffect, useRef } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function SwaggerPage() {
  const uiRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const loadSwagger = async () => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css'
      document.head.appendChild(link)

      const script = document.createElement('script')
      script.src = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js'
      script.onload = () => {
        const w = window as any
        if (w.SwaggerUIBundle && uiRef.current) {
          w.SwaggerUIBundle({
            url: '/api/v1/openapi',
            dom_id: '#swagger-ui',
            presets: [w.SwaggerUIBundle.presets.apis],
            layout: 'BaseLayout',
            deepLinking: true,
            showExtensions: true,
            showCommonExtensions: true,
            tryItOutEnabled: true,
            supportedSubmitMethods: ['get', 'put', 'post', 'delete', 'patch'],
            docExpansion: 'list',
            filter: true,
            defaultModelsExpandDepth: 1,
            defaultModelExpandDepth: 1,
            persistAuthorization: true,
            displayRequestDuration: true,
            showMutatedRequest: true,
            syntaxHighlight: { activated: true, theme: 'monokai' },
            requestSnippetsEnabled: true,
          })
        }
      }
      document.body.appendChild(script)
    }

    loadSwagger()

    return () => {
      const link = document.querySelector('link[href*="swagger-ui.css"]')
      if (link) link.remove()
      const script = document.querySelector('script[src*="swagger-ui-bundle"]')
      if (script) script.remove()
      const el = document.getElementById('swagger-ui')
      if (el) el.innerHTML = ''
    }
  }, [])

  return (
    <div className="min-h-screen" style={{ background: '#1e293b' }}>
      <div className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur border-b border-slate-800/60 px-6 py-3">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">
          <Link
            href="/api-docs"
            className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Docs
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-500">
              <span className="text-emerald-400">●</span> Try it Out enabled
            </span>
            <span className="text-xs text-slate-500">
              Server: <code className="text-xs font-mono text-admin-400">/api/v1</code>
            </span>
          </div>
        </div>
      </div>
      <div className="max-w-[1600px] mx-auto">
        <div ref={uiRef} id="swagger-ui" />
      </div>
      <style>{`
        #swagger-ui {
          padding: 0;
        }
        .swagger-ui {
          color: #e2e8f0;
          font-family: inherit;
        }
        .swagger-ui .topbar { display: none; }
        .swagger-ui .info { margin: 20px 20px 0; padding: 20px; background: #1e293b; border: 1px solid #334155; border-radius: 8px; }
        .swagger-ui .info .title { color: #f1f5f9; font-size: 24px; }
        .swagger-ui .info .description p { color: #94a3b8; font-size: 14px; }
        .swagger-ui .info .contact a { color: #818cf8; }
        .swagger-ui .info .base-url { color: #64748b; font-size: 13px; }
        .swagger-ui .scheme-container {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          margin: 10px 20px;
          padding: 12px 20px;
          box-shadow: none;
        }
        .swagger-ui .scheme-container .schemes-title { color: #94a3b8; }
        .swagger-ui .opblock-tag {
          background: #1e293b;
          border: 1px solid #334155;
          border-radius: 8px;
          margin: 10px 20px;
          padding: 12px 20px;
          color: #e2e8f0;
          font-size: 18px;
        }
        .swagger-ui .opblock { 
          border-radius: 6px; 
          margin: 0 20px 8px;
          border: 1px solid #334155;
        }
        .swagger-ui .opblock .opblock-summary {
          padding: 8px 12px;
        }
        .swagger-ui .opblock .opblock-summary-description { color: #94a3b8; }
        .swagger-ui .opblock.opblock-get { background: #0f172a; border-color: #1e3a5f; }
        .swagger-ui .opblock.opblock-post { background: #0f172a; border-color: #1a3a2a; }
        .swagger-ui .opblock.opblock-put { background: #0f172a; border-color: #3a2a1a; }
        .swagger-ui .opblock.opblock-delete { background: #0f172a; border-color: #3a1a1a; }
        .swagger-ui .opblock .opblock-summary-method { border-radius: 4px; font-size: 12px; font-weight: 700; padding: 4px 10px; min-width: 60px; text-align: center; }
        .swagger-ui .opblock .opblock-section-header {
          background: #1e293b;
          border: none;
          padding: 12px 20px;
          min-height: auto;
        }
        .swagger-ui .opblock .opblock-section-header h4 { color: #e2e8f0; }
        .swagger-ui .opblock .opblock-section-header label { color: #94a3b8; }
        .swagger-ui .btn { border-radius: 6px; font-size: 13px; font-weight: 600; padding: 6px 16px; }
        .swagger-ui .btn.execute { background-color: #6366f1; border-color: #6366f1; color: #fff; }
        .swagger-ui .btn.execute:hover { background-color: #4f46e5; }
        .swagger-ui .btn.try-out__btn { background: transparent; border: 1px solid #6366f1; color: #a5b4fc; }
        .swagger-ui .btn.try-out__btn:hover { background: #312e81; }
        .swagger-ui input, .swagger-ui textarea, .swagger-ui select {
          background: #0f172a;
          border: 1px solid #334155;
          color: #e2e8f0;
          border-radius: 6px;
          padding: 8px 12px;
        }
        .swagger-ui .parameter__name { color: #e2e8f0; font-size: 13px; }
        .swagger-ui .parameter__type { color: #64748b; font-size: 12px; }
        .swagger-ui .parameter__in { color: #64748b; font-size: 11px; }
        .swagger-ui .model-box { background: #0f172a; border-radius: 6px; padding: 12px; }
        .swagger-ui .model { color: #e2e8f0; }
        .swagger-ui .model-title { color: #e2e8f0; }
        .swagger-ui table thead tr td { color: #94a3b8; border-bottom: 1px solid #334155; }
        .swagger-ui table tbody tr td { color: #e2e8f0; border-bottom: 1px solid #1e293b; }
        .swagger-ui .response-col_status { color: #e2e8f0; }
        .swagger-ui .response-col_description { color: #94a3b8; }
        .swagger-ui .responses-inner h4, .swagger-ui .responses-inner h5 { color: #e2e8f0; }
        .swagger-ui .markdown p, .swagger-ui .markdown li { color: #94a3b8; }
        .swagger-ui .markdown code { color: #f472b6; background: #1e293b; }
        .swagger-ui .auth-wrapper .auth-btn { color: #94a3b8; }
        .swagger-ui .auth-container { background: #1e293b; border: 1px solid #334155; border-radius: 8px; padding: 16px; }
        .swagger-ui .auth-container h4 { color: #e2e8f0; }
        .swagger-ui .auth-container .auth-btn { color: #818cf8; }
        .swagger-ui section.models { margin: 10px 20px; }
        .swagger-ui section.models.is-open h4 { border-bottom: 1px solid #334155; }
        .swagger-ui .model-container { background: #0f172a; border-radius: 6px; margin: 4px 0; }
        .swagger-ui .model-container .models-control { color: #e2e8f0; }
        .swagger-ui .loading-container { padding: 40px; text-align: center; }
        .swagger-ui .loading-container .loading { color: #64748b; }
        .swagger-ui select { background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 16 16'%3E%3Cpath fill='%2394a3b8' d='M4 6l4 4 4-4'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 8px center; padding-right: 28px; }
        .swagger-ui .responses-wrapper { border-radius: 0 0 6px 6px; }
        .swagger-ui .response-col_links { display: none; }
        .swagger-ui .responses-header td { color: #94a3b8; }
        .swagger-ui .dialog-ux .backdrop-ux { background: rgba(0,0,0,0.6); }
        .swagger-ui .dialog-ux .modal-ux { background: #1e293b; border: 1px solid #334155; border-radius: 12px; }
        .swagger-ui .dialog-ux .modal-ux-header { border-bottom: 1px solid #334155; }
        .swagger-ui .dialog-ux .modal-ux-header h3 { color: #e2e8f0; }
        .swagger-ui .dialog-ux .modal-ux-content h4 { color: #e2e8f0; }
        .swagger-ui .dialog-ux .modal-ux-content label { color: #94a3b8; }
      `}</style>
    </div>
  )
}
