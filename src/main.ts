import { Actor } from "apify";
import { PuppeteerCrawler } from "crawlee";

export interface ScrapedLoanData {
  [key: string]: any;
}

await Actor.main(async () => {
  const startUrls = [
    "https://www.navyfederal.org/loans-cards/mortgage/mortgage-rates/conventional-fixed-rate-mortgages.html",
  ];

  // Create a PuppeteerCrawler that will use the proxy configuration and and handle requests with the router from routes.js file.
  const crawler = new PuppeteerCrawler({
    // proxyConfiguration,
    // requestHandler: router,
    launchContext: {
      launchOptions: {
        headless: true,
      },
    },
    maxRequestRetries: Number(process.env.MAX_REQUEST_RETRIES) ?? 0,
    maxRequestsPerCrawl: Number(process.env.MAX_REQUESTS_PER_CRAWL) ?? 2,
    navigationTimeoutSecs: Number(process.env.NAVIGATION_TIMEOUT_SECS) ?? 60,
    requestHandlerTimeoutSecs:
      Number(process.env.REQUEST_HANDLER_TIMEOUT_SECS) ?? 60,
    // Activates the Session pool (default is true).
    useSessionPool:
      process.env.USE_SESSION_POOL?.toLowerCase() === "false" ? false : true,
    // Overrides default Session pool configuration
    sessionPoolOptions: {
      maxPoolSize: Number(process.env.MAX_POOL_SIZE) ?? 100,
    },
    // Set to true if you want the crawler to save cookies per session,
    // and set the cookies to page before navigation automatically (default is true).
    persistCookiesPerSession:
      process.env.PERSIST_COOKIES_PER_SESSION?.toLowerCase() === "false"
        ? false
        : true,
    autoscaledPoolOptions: {
      maxConcurrency: Number(process.env.AUTOSCALE_POOL_MAX_CONCURRENCY) ?? 1,
    },

    async requestHandler(ctx) {
      const { request, page, log, session, pushData } = ctx;
      const title = await page.title();
      const url = request.loadedUrl;

      log.info("crawling", { title, url });
      if (session) {
        if (title === "Blocked") {
          session.retire();
        } else if (
          title === "Not sure if blocked, might also be a connection error"
        ) {
          session.markBad();
        }
        // this step is done automatically in PuppeteerCrawler.
        // else { session.markGood() }
      }

      const tableSelector = ".rates-table table";
      await page.waitForSelector(tableSelector);
      // const interestRatesTable = await page.$(tableSelector);
      try {
        const tableData = await page.$eval(tableSelector, async (table) => {
          // const data: { [key: string]: any } = {};
          const data: ScrapedLoanData[] = [];
          const tHeader = table.tHead?.innerText;
          // Should look something like this:
          //  ['Term', 'Interest Rates As Low As', 'Discount Points', 'APR As Low As']
          const cols = tHeader?.replace("\n", "").split("\t");
          const tBodies = table.tBodies;
          if (tBodies && tBodies.length > 0) {
            const tBody = tBodies[0];
            const tRows: HTMLTableRowElement[] = Array.from(tBody.rows);

            if (tRows && cols) {
              for (const r of tRows) {
                const dataRow: { [key: string]: any } = {};
                const cells = r.cells;
                for (const c of cells) {
                  const h = c.dataset.th!!;
                  dataRow[h] = c.textContent;
                }
                data.push(dataRow);
              }
            } else {
              throw new Error("failed to scrape table header or table data");
            }
          } else {
            throw new Error("failed to get table body");

          }
          return data;
        });

        log.info("scraped data", tableData);

        await pushData(tableData);
      } catch (error: any) {
        log.error(error.message);
      }
    },
  });

  // Run the crawler with the start URLs and wait for it to finish.
  await crawler.run(startUrls);
});
