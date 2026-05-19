import { Inject, Injectable } from "@nestjs/common";
import { z } from "zod";
import { tool } from "@langchain/core/tools";
import { Runnable } from "@langchain/core/runnables";
import {
  AIMessage,
  AIMessageChunk,
  BaseMessage,
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

const queryUserArgsSchema = z.object({
  userId: z.string().describe("用户 ID，例如: 001, 002, 003"),
});

@Injectable()
export class AiService {
  private readonly modelWidthTools: Runnable<BaseMessage[], AIMessage>;

  constructor(
    @Inject("CHAT_MODEL") model: ChatOpenAI,
    @Inject("QUERY_USER_TOOL") private readonly queryUserTool: any,
    @Inject("SEND_MAIL_TOOL") private sendMailTool: any,
    @Inject("WEB_SEARCH_TOOL") private webSearchTool: any,
    @Inject("DB_USERS_CRUD_TOOL") private dbUsersCrudTool: any,
  ) {
    this.modelWidthTools = model.bindTools([
      this.queryUserTool,
      this.sendMailTool,
      this.webSearchTool,
      this.dbUsersCrudTool,
    ]);
  }

  async runChain(query: string): Promise<string> {
    const messages: BaseMessage[] = [
      new SystemMessage(
        "你是一个智能助手，可以在需要时调用工具（如 query_user）来查询用户信息，再用结果回答用户的问题。",
      ),
      new HumanMessage(query),
    ];

    while (true) {
      const aiMessage = await this.modelWidthTools.invoke(messages);
      messages.push(aiMessage);

      const toolCalls = aiMessage.tool_calls ?? [];

      if (!toolCalls.length) {
        return aiMessage.content as string;
      }
      for (const toolCall of toolCalls) {
        const toolId = toolCall.id || "";
        const toolName = toolCall.name || "";
        switch (toolName) {
          case "query_user": {
            const result = await this.queryUserTool.invoke(toolCall.args);
            messages.push(
              new ToolMessage({
                tool_call_id: toolId,
                name: toolName,
                content: result,
              }),
            );
            break;
          }
          case "send_mail": {
            const result = await this.sendMailTool.invoke(toolCall.args);
            messages.push(
              new ToolMessage({
                tool_call_id: toolId,
                name: toolName,
                content: result,
              }),
            );
            break;
          }
          case "web_search": {
            const result = await this.webSearchTool.invoke(toolCall.args);
            console.log(result);
            messages.push(
              new ToolMessage({
                tool_call_id: toolId,
                name: toolName,
                content: result,
              }),
            );
            break;
          }
          case "db_users_crud": {
            const result = await this.dbUsersCrudTool.invoke(toolCall.args);
            messages.push(
              new ToolMessage({
                tool_call_id: toolId,
                name: toolName,
                content: result,
              }),
            );
            break;
          }
        }
      }
    }
  }

  async *runChainStream(query: string) {
    const messages: BaseMessage[] = [
      new SystemMessage(
        "你是一个智能助手，可以在需要时调用工具（如 query_user）来查询用户信息，再用结果回答用户的问题。",
      ),
      new HumanMessage(query),
    ];

    while (true) {
      const stream = await this.modelWidthTools.stream(messages);
      let fullAIMessage: AIMessageChunk | null = null;

      for await (const chunk of stream as AsyncIterable<AIMessageChunk>) {
        fullAIMessage = fullAIMessage ? fullAIMessage.concat(chunk) : chunk;

        const hasToolCallChunk =
          !!fullAIMessage.tool_call_chunks &&
          fullAIMessage.tool_call_chunks.length > 0;

        if (!hasToolCallChunk && chunk.content) {
          yield chunk.content as string;
        }
      }

      if (!fullAIMessage) return;

      messages.push(fullAIMessage);

      const toolCalls = fullAIMessage.tool_calls ?? [];
      if (!toolCalls.length) return;
      for (const toolCall of toolCalls) {
        const toolCallId = toolCall.id || "";
        const toolName = toolCall.name;
        switch (toolName) {
          case "query_user": {
            const result = await this.queryUserTool.invoke(toolCall.args);
            messages.push(
              new ToolMessage({
                tool_call_id: toolCallId,
                name: toolName,
                content: result,
              }),
            );
            break;
          }
          case "send_mail": {
            const result = await this.sendMailTool.invoke(toolCall.args);
            messages.push(
              new ToolMessage({
                tool_call_id: toolCallId,
                name: toolName,
                content: result,
              }),
            );
            break;
          }
          case "web_search": {
            const result = await this.webSearchTool.invoke(toolCall.args);
            console.log(result);
            messages.push(
              new ToolMessage({
                tool_call_id: toolCallId,
                name: toolName,
                content: result,
              }),
            );
            break;
          }
          case "db_users_crud": {
            const result = await this.dbUsersCrudTool.invoke(toolCall.args);
            messages.push(
              new ToolMessage({
                tool_call_id: toolCallId,
                name: toolName,
                content: result,
              }),
            );
            break;
          }
        }
      }
    }
  }
}
