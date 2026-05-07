import { ChatOpenAI } from '@langchain/openai'
import { tool } from '@langchain/core/tools'
import { z } from 'zod'
import { HumanMessage } from '@langchain/core/messages'

const model = new ChatOpenAI({
  modelName: 'qwen3.5-plus',
  apiKey: 'sk-640de09653df4f9f8974dd9c9aa0ce82',
  configuration: {
    baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
  }
})


const getWeather = tool(
  (city) => {
    return `${city}的天气阳光明媚`
  },
  {
    name: 'get_weather',
    description: '用于获取天气信息',
    schema: z.object({
      city: z.string().describe('城市名称')
    })
  }
)

const tools = [getWeather]

const modelWidthTool = model.bindTools(tools)

const messages = [
  new HumanMessage('武汉现在天气怎么样?')
]

let response = await modelWidthTool.invoke(messages)

console.log(response)