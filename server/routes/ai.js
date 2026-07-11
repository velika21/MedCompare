const express = require('express')
const router = express.Router()
const { GoogleGenerativeAI } = require('@google/generative-ai')

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

router.post('/recommend', async (req, res) => {
  try {
    const { symptoms } = req.body

    if (!symptoms || symptoms.trim().length < 5) {
      return res.status(400).json({
        message: 'Please describe your symptoms in more detail.'
      })
    }

    res.setHeader('Content-Type', 'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection', 'keep-alive')

    const model = genAI.getGenerativeModel({ model: 'gemini-3.5-flash' })

    const prompt = `You are a helpful medical assistant for MedCompare, a platform that helps users find and book diagnostic tests at hospitals in India.

Your job is to suggest relevant diagnostic tests based on the user's symptoms.

STRICT RULES:
- Never diagnose diseases or medical conditions
- Always recommend consulting a doctor
- Suggest 2-4 relevant tests maximum
- Keep your response concise and friendly
- Format your response exactly like this:

**Based on your symptoms, here are some tests that might help:**

1. **[Test Name]** — [One line explaining why this test is relevant]
2. **[Test Name]** — [One line explaining why this test is relevant]

**Important:** These are suggestions only. Please consult a doctor before booking any tests.

Available tests on our platform: MRI Brain, X-Ray Chest, CT Scan Abdomen, Blood CBC, Thyroid Profile, Ultrasound Abdomen. Only suggest tests from this list.

User symptoms: ${symptoms}`

    const result = await model.generateContentStream(prompt)

    for await (const chunk of result.stream) {
      const text = chunk.text()
      if (text) {
        res.write(`data: ${JSON.stringify({ content: text })}\n\n`)
      }
    }

    res.write('data: [DONE]\n\n')
    res.end()
  } catch (err) {
    console.error('Gemini error:', err.message)
    if (!res.headersSent) {
      res.status(500).json({
        message: 'AI service unavailable. Please try again.'
      })
    }
  }
})

module.exports = router