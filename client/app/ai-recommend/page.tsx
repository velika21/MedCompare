'use client'
import { useState } from 'react'
import Link from 'next/link'

const SUGGESTED_SYMPTOMS = [
  'Fever and sore throat for 3 days',
  'Chest pain and shortness of breath',
  'Fatigue and weight gain',
  'Stomach pain and bloating',
  'Headache and blurred vision',
  'Joint pain and swelling',
]

const TEST_SEARCH_MAP: Record<string, string> = {
  'Blood CBC': 'Blood CBC',
  'Thyroid Profile': 'Thyroid Profile',
  'X-Ray Chest': 'X-Ray Chest',
  'MRI Brain': 'MRI Brain',
  'CT Scan Abdomen': 'CT Scan Abdomen',
  'Ultrasound Abdomen': 'Ultrasound Abdomen',
}

export default function AIRecommendPage() {
  const [symptoms, setSymptoms] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  const getRecommendation = async (symptomText?: string) => {
    const text = symptomText || symptoms
    if (!text.trim() || text.trim().length < 5) {
      setError('Please describe your symptoms in a bit more detail.')
      return
    }

    setLoading(true)
    setResult('')
    setError('')
    setDone(false)


    
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'https://medcompare-api.onrender.com'}/api/ai/recommend`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ symptoms: text })
        }
      )

      if (!response.ok) {
        const err = await response.json()
        setError(err.message || 'Something went wrong. Please try again.')
        setLoading(false)
        return
      }

      // Read the streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        setError('Streaming not supported.')
        setLoading(false)
        return
      }

      let buffer = ''
      while (true) {
        const { done: streamDone, value } = await reader.read()
        if (streamDone) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') {
              setDone(true)
              continue
            }
            try {
              const parsed = JSON.parse(data)
              if (parsed.content) {
                setResult(prev => prev + parsed.content)
              }
            } catch {
              // skip malformed chunks
            }
          }
        }
      }
    } catch (err) {
      setError('Could not connect to AI service. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Extract test names mentioned in the AI result
  const extractedTests = Object.keys(TEST_SEARCH_MAP).filter(test =>
    result.toLowerCase().includes(test.toLowerCase())
  )

  // Simple markdown-like renderer
  const renderResult = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('**') && line.endsWith('**')) {
        return <p key={i} className="font-semibold text-gray-800 mt-3 mb-1">{line.replace(/\*\*/g, '')}</p>
      }
      if (line.match(/^\d+\. \*\*/)) {
        const parts = line.replace(/^\d+\. /, '').split('** — ')
        const testName = parts[0].replace(/\*\*/g, '')
        const desc = parts[1] || ''
        return (
          <div key={i} className="flex gap-3 mt-2 p-3 bg-blue-50 rounded-xl border border-blue-100">
            <span className="text-blue-600 font-bold text-lg leading-none mt-0.5">•</span>
            <div>
              <span className="font-semibold text-blue-800">{testName}</span>
              {desc && <span className="text-gray-600"> — {desc}</span>}
            </div>
          </div>
        )
      }
      if (line.startsWith('**Important:**') || line.includes('consult a doctor')) {
        return (
          <div key={i} className="mt-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-sm text-amber-800">
            ⚠️ {line.replace(/\*\*/g, '')}
          </div>
        )
      }
      if (line.trim()) {
        return <p key={i} className="text-gray-600 text-sm mt-1">{line}</p>
      }
      return null
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white">
        <div className="max-w-3xl mx-auto px-4 py-10 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500 bg-opacity-40 px-4 py-1.5 rounded-full text-xs font-semibold tracking-wide mb-4">
            ✨ AI-powered
          </div>
          <h1 className="text-3xl font-bold mb-3">What tests do I need?</h1>
          <p className="text-blue-100 text-sm max-w-md mx-auto">
            Describe your symptoms and our AI will suggest relevant diagnostic tests available near you.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* Input card */}
        <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Describe your symptoms
          </label>
          <textarea
            value={symptoms}
            onChange={e => setSymptoms(e.target.value)}
            placeholder="e.g. I've had a fever of 101°F and sore throat for the past 3 days, along with body aches..."
            className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 resize-none h-28 text-gray-800 placeholder-gray-400"
          />

          {error && (
            <p className="text-red-500 text-xs mt-2">{error}</p>
          )}

          <button
            onClick={() => getRecommendation()}
            disabled={loading || !symptoms.trim()}
            className="mt-3 w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2">
            {loading ? (
              <>
                <span className="animate-spin text-lg">⟳</span>
                AI is analysing your symptoms...
              </>
            ) : (
              '✨ Get test recommendations'
            )}
          </button>

          <p className="text-xs text-gray-400 text-center mt-2">
            This is not medical advice. Always consult a qualified doctor.
          </p>
        </div>

        {/* Suggested symptoms */}
        {!result && !loading && (
          <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm mb-6">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Try an example
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTED_SYMPTOMS.map(s => (
                <button
                  key={s}
                  onClick={() => {
                    setSymptoms(s)
                    getRecommendation(s)
                  }}
                  className="text-xs bg-gray-50 border border-gray-200 text-gray-700 px-3 py-2 rounded-xl hover:bg-blue-50 hover:border-blue-200 hover:text-blue-700 transition-colors">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Streaming result */}
        {(result || loading) && (
          <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm mb-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                AI
              </div>
              <span className="text-sm font-semibold text-gray-700">Recommendation</span>
              {loading && (
                <span className="text-xs text-blue-500 animate-pulse ml-auto">Generating...</span>
              )}
            </div>

            <div className="text-sm leading-relaxed">
              {renderResult(result)}
              {loading && !result && (
                <div className="flex gap-1 mt-2">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              )}
            </div>

            {/* Quick action buttons for extracted tests */}
            {done && extractedTests.length > 0 && (
              <div className="mt-5 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                  Find hospitals offering these tests
                </p>
                <div className="flex flex-wrap gap-2">
                  {extractedTests.map(test => (
                    <Link
                      key={test}
                      href={`/search?testName=${encodeURIComponent(test)}`}
                      className="text-sm bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-colors font-medium">
                      Search {test} →
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Try again */}
            {done && (
              <button
                onClick={() => { setResult(''); setSymptoms(''); setDone(false) }}
                className="mt-4 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                ← Try different symptoms
              </button>
            )}
          </div>
        )}

        {/* Info card */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-blue-800 mb-2">How this works</h3>
          <ul className="text-xs text-blue-700 space-y-1.5">
            <li>• You describe your symptoms in plain language</li>
            <li>• Our AI analyses them and suggests relevant diagnostic tests</li>
            <li>• You click to search hospitals offering those tests near you</li>
            <li>• Book and pay — all in one place</li>
          </ul>
        </div>

      </div>
    </div>
  )
}
