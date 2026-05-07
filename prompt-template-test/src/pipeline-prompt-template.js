import 'dotenv/config'
import { ChatOpenAI } from '@langchain/openai'

const model = new ChatOpenAI({
  modelName: process.env.MODEL_NAME,
  apiKey: process.env.OPENAI_API_KEY,
  configuration: {
    baseURL: process.env.OPENAI_BASE_URL
  }
})

// A. 人设模块