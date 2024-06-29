import { Injectable } from '@nestjs/common';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
@Injectable()
export class LangChainService {
  private chatModel;
  constructor() {
    this.chatModel = new ChatOpenAI({});
  }
  async enhanceProductDescriptions(product: {
    productName: string;
    description: string;
    categoryName: string;
  }) {
    const outputParser = new StringOutputParser();

    const prompt = ChatPromptTemplate.fromMessages([
      [
        'system',
        'You are an expert in medical sales. Your specialty is medical consumables used by hospitals on a daily basis. Your task to enhance the description of a product based on the information provided.',
      ],
      [
        'user',
        `Product name: {productName}
         Product description: {description}
         Category: {nameOfCategory}
         New Description:
        `,
      ],
    ]);

    const llmChain = prompt.pipe(this.chatModel).pipe(outputParser);

    const desc = await llmChain.invoke({
      productName: product.productName,
      description: product.description,
      nameOfCategory: product.categoryName,
    });

    return desc;
  }
}
