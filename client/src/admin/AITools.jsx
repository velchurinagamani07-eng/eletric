import { useState } from 'react'
import toast from 'react-hot-toast'
import { Bot, Copy, Sparkles } from 'lucide-react'

const templates = {
  service:
    'Write a concise premium service description for: [service name]. Include safety, transparent pricing, and 3-month warranty in Tuni.',
  product:
    'Write a product description for: [product name]. Mention brand, use case, installation fit, warranty, and why it is reliable.',
  notification:
    'Write a polite customer notification for booking status: [status]. Keep it short, helpful, and professional.',
}

export default function AITools() {
  const [template, setTemplate] = useState('service')
  const [text, setText] = useState(templates.service)

  const copyText = async () => {
    await navigator.clipboard.writeText(text)
    toast.success('Copied prompt.')
  }

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-gray-900">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100 text-amber-700">
          <Bot size={22} />
        </span>
        <div>
          <h2 className="font-bold text-navy-900 dark:text-white">AI Tools</h2>
          <p className="mt-1 text-sm text-gray-500">Prompt templates for service copy, product copy, and operations messages.</p>
        </div>
      </div>

      <div className="mt-5 grid gap-4">
        <label>
          <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Template</span>
          <select
            className="field"
            value={template}
            onChange={(event) => {
              setTemplate(event.target.value)
              setText(templates[event.target.value])
            }}
          >
            <option value="service">Service description</option>
            <option value="product">Product description</option>
            <option value="notification">Notification message</option>
          </select>
        </label>
        <label>
          <span className="mb-2 block text-sm font-medium text-gray-600 dark:text-gray-300">Prompt</span>
          <textarea className="field min-h-44" value={text} onChange={(event) => setText(event.target.value)} />
        </label>
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <button type="button" className="btn-primary" onClick={copyText}>
          <Copy size={17} /> Copy Prompt
        </button>
        <span className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 text-sm font-semibold text-amber-800">
          <Sparkles size={16} /> Connect a backend model endpoint when ready
        </span>
      </div>
    </section>
  )
}
