// Apify SDK - toolkit for building Apify Actors (Read more at https://docs.apify.com/sdk/js/).
import { Actor } from "apify";
// Web scraping and browser automation library (Read more at https://crawlee.dev)
// import { PuppeteerCrawler, Request } from "crawlee";
import { 
// CrawlerRunOptions,
// Dictionary,
PuppeteerCrawler,
// RequestOptions,
 } from "crawlee";
import router from "./routes";
// interface Input {
//   startUrls: Request[];
// }
(async () => {
    await Actor.main(async () => {
        // Define the URLs to start the crawler with - get them from the input of the Actor or use a default list.
        // const {
        //   startUrls = [
        //     "https://www.navyfederal.org/loans-cards/mortgage/mortgage-rates/conventional-fixed-rate-mortgages.html",
        //   ],
        // } = (await Actor.getInput<Input>()) ?? {};
        // const startUrls = [
        //   "https://www.navyfederal.org/loans-cards/mortgage/mortgage-rates/conventional-fixed-rate-mortgages.html",
        // ];
        // Create a proxy configuration that will rotate proxies from Apify Proxy.
        // const proxyConfiguration = await Actor.createProxyConfiguration();
        // Create a PuppeteerCrawler that will use the proxy configuration and and handle requests with the router from routes.js file.
        const crawler = new PuppeteerCrawler({
            // proxyConfiguration,
            requestHandler: router,
            launchContext: {
                launchOptions: {
                    headless: true,
                    timeout: 5000, // ms
                },
            },
        });
        // Run the crawler with the start URLs and wait for it to finish.
        await crawler.run();
    });
})();
//# sourceMappingURL=main.js.map