import dotenv from "dotenv";
import fs from "fs";
import Scraper from "./module/Scraper.js";

dotenv.config();

function readTextFile() {
  try {
    // 파일을 utf-8 인코딩으로 읽어 문자열로 변환합니다.
    const content = fs.readFileSync("./tmp.txt", "utf8");
    return content;
  } catch (error) {
    console.error("파일 읽기에 실패하였습니다:", error);
    return null;
  }
}

function parseContent(fileContent) {
  const sections = fileContent.split("<").filter((line) => line.trim() !== ""); // "<" 기준으로 해외/국내 분리
  let result = [];

  sections.forEach((section) => {
    const area = section.substring(0, section.indexOf(">")).trim(); // 해외/국내 정보 추출
    const content = section.substring(section.indexOf(">") + 1).trim(); // 내용 추출
    if (content) {
      const items = content.split("\n\n"); // 항목 분리 (두 개의 개행 문자 기준)
      items.forEach((item) => {
        const lines = item.split("\n").filter((line) => line.trim() !== ""); // 각 항목 내 줄 분리 및 빈 줄 제거

        if (lines.length > 0) {
          const title = lines[0].trim(); // 첫 번째 줄: 제목
          const url = lines[1].trim(); // 마지막 줄: URL

          result.push({
            area: area,
            title: title,
            url: url,
          });
        }
      });
    }
  });

  return result;
}

const scraper = new Scraper();

const fileContent = readTextFile();
// console.log(fileContent);

const contents = parseContent(fileContent);
// console.log(contents);

// Promise.all을 사용해 병렬 처리.
Promise.all(
  contents.map(async (content) => {
    const bodyContent = await scraper.scrapeContent(content.url);
    content.content = bodyContent;
  })
)
  .then(() => {
    console.log("스크래핑 완료:", contents);
    const saveToFile = (filename, data) => {
      fs.writeFileSync(filename, data, { flag: "w" }, (err) => {
        if (err) {
          console.error(`${filename} 저장 실패:`, err);
        } else {
          console.log(`${filename} 저장 성공`);
        }
      });
    };

    const formattedContents = contents
      .map(
        (content) =>
          `Area: ${content.area}\nTitle: ${content.title}\nURL: ${content.url}\nContent: ${content.content}\n\n`
      )
      .join("");

    saveToFile("scrape.txt", formattedContents);
  })
  .catch((e) => {
    console.error("스크래핑 실패:", e);
    return;
  });
