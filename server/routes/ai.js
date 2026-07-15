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

const redis_client = require('../config/redis')

// GET /api/ai/review-summary/:hospitalId
router.get('/review-summary/:hospitalId', async (req, res) => {
  try {
    const { hospitalId } = req.params
    const cacheKey = `ai-review-summary:${hospitalId}`

    // Step 1: Check Redis cache first (cached for 1 hour)
    try {
      const cached = await redis_client.get(cacheKey)
      if (cached) {
        return res.json({ summary: cached, cached: true })
      }
    } catch (cacheErr) {
      console.error('Redis error (continuing):', cacheErr.message)
    }

    // Step 2: Fetch all reviews for this hospital
    const Review = require('../models/Review')
    const reviews = await Review.find({ hospital: hospitalId })
      .populate('user', 'name')
      .sort({ createdAt: -1 })
      .limit(20) // only analyse latest 20 reviews

    if (reviews.length === 0) {
      return res.json({ summary: null })
    }

    if (reviews.length < 2) {
      return res.json({ summary: null }) // not enough reviews to summarise
    }

    // Step 3: Build the prompt with real review data
    const reviewText = reviews.map(r =>
      `- ${r.user?.name || 'Patient'} (${r.rating}/5): "${r.comment || 'No comment'}"`
    ).join('\n')

    const avgRating = (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)

    const prompt = `You are summarising patient reviews for a hospital on a medical booking platform in India.

Here are ${reviews.length} patient reviews (average rating: ${avgRating}/5):

${reviewText}

Write a 2-sentence summary of what patients think about this hospital. 
- Sentence 1: What patients love or consistently praise
- Sentence 2: Any concerns or areas for improvement (if any), otherwise mention what makes it stand out

Keep it factual, neutral, and under 50 words total. Do not use bullet points. Do not start with "Patients" — vary the opening.`

    // Step 4: Call Gemini (non-streaming since we want to cache the result)
    const { GoogleGenerativeAI } = require('@google/generative-ai')
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

    const result = await model.generateContent(prompt)
    const summary = result.response.text().trim()

    // Step 5: Cache for 1 hour (reviews don't change that often)
    try {
      await redis_client.set(cacheKey, summary, { ex: 3600 })
    } catch (cacheErr) {
      console.error('Redis set error (continuing):', cacheErr.message)
    }

    res.json({ summary, cached: false })
  } catch (err) {
    console.error('Review summary error:', err.message)
    res.status(500).json({ summary: null })
  }
})


module.exports = router