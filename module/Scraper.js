import puppeteer from "puppeteer";

class Scraper {
  constructor() {}

  // 페이지 설정 및 필요한 경우 로그인 처리
  async _setupPage(url) {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    if (url.includes("dataguidance.com")) {
      await page.goto("https://dataguidance.com/login", {
        waitUntil: "domcontentloaded",
      });
      await page.type("#user_email", process.env.DATAGUIDANCE_ID);
      await page.type("#user_password", process.env.DATAGUIDANCE_PW);
      await page.click("#log_in");
      await page.waitForSelector('[aria-label="User avatar"]');
    }

    return { browser, page };
  }

  // SPA 방식의 라우팅을 모방합니다.
  async _navigateSPA(page, url) {
    await page.evaluate((targetUrl) => {
      history.pushState(null, null, targetUrl);
      window.dispatchEvent(new PopStateEvent("popstate"));
    }, url);
  }

  // 페이지 콘텐츠를 추출합니다.
  async _extractBodyContent(page) {
    await page.waitForFunction(
      () => document.body && document.body.innerText.trim().length > 0,
      { timeout: 120000 }
    );

    return await page.evaluate(() => {
      const body = document.querySelector("body");
      if (!body) return "";

      const unwantedTags = [
        "aside",
        "script",
        "noscript",
        "ul",
        "li",
        "app-nav",
        "app-sub-nav",
        "header",
        "button",
      ];
      unwantedTags.forEach((tag) => {
        document.querySelectorAll(tag).forEach((el) => el.remove());
      });

      return body.innerText;
    });
  }

  // SPA 전용 스크래핑 메서드
  async scrapeSPA(url) {
    const { browser, page } = await this._setupPage(url);
    try {
      await this._navigateSPA(page, url);
      const content = await this._extractBodyContent(page);
      return content;
    } catch (error) {
      //   console.error(`Failed to scrape SPA ${url}:`, error);
      return "";
    } finally {
      await browser.close();
    }
  }

  // 일반 스크래핑 메서드 (실패 시 fallback 처리)
  async scrapeContent(url) {
    const { browser, page } = await this._setupPage(url);
    try {
      await this._navigateSPA(page, url);
      const content = await this._extractBodyContent(page);

      // console.log(`Content from ${url}:`, content);
      return content;
    } catch (error) {
      //   console.error(`Failed to scrape ${url}:`, error);
      try {
        await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
        const fallbackContent = await this._extractBodyContent(page);

        // console.log(`Fallback content from ${url}:`, fallbackContent);
        return fallbackContent;
      } catch (fallbackError) {
        // console.error(`Fallback failed for ${url}:`, fallbackError);
        return "";
      }
    } finally {
      await browser.close();
    }
  }
}

export default Scraper;
