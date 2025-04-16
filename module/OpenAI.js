import OpenAI from "openai";

class OpenAI {
  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async searchReference(title, content) {
    try {
      const completion = await this.client.chat.completion.create({
        model: "gpt-4o-search-preview",
        prompt: `
		요구사항:
		다음에 제공되는 텍스트와 관련된 뉴스 기사, 아티클, 블로그 포스트 등 신뢰할 수 있는 출처의 URL을 찾아주세요.
		
		텍스트:
		 - title: ${title}
		 - content: ${content}

		요청사항:
		1. 제공된 텍스트의 핵심 키워드와 주제를 분석하여 관련 주제를 파악합니다.
		2. 국내외의 최신 뉴스 기사 및 아티클, 블로그 포스트 등 신뢰할 수 있는 출처에서 자료 및 URL을 검색합니다.
		3. 각 URL에 대해 간단한 요약(한두 문장)도 작성해 주세요.
		4. 검색 결과에 국내 자료와 국제 자료가 모두 포함되도록 합니다.
		5. 가능한 최신 데이터를 반영하되, 자료의 신뢰성을 우선 고려합니다.
		6. 다양한 출처(국내 및 국제)에서 자료를 제공해 주세요.
		`,
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      throw new Error(`OpenAI API 요청 실패: ${error.message}`);
    }
  }
}

module.exports = OpenAI;
