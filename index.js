const { chromium } = require("playwright");

// const baseUrl = "https://e-portal.svt.bss.loc/shop";
const baseUrl = "https://master.ecom.netcracker.com:8443/shop";
const city = "Саратов ";
// const city = "Воронеж ";
// const city = "Пермь";
// const address = "Космонавта Леонова ул 50";
const address = "Ново-Воронежская ул. 1";
const username = "user@mail.ru";
const password = "Qwerty1!";

const nfrs = {
  "NFR-ECOM-RT-UI-101": { er: 2000 },
  "NFR-ECOM-RT-UI-103": { er: 2000 },
  "NFR-ECOM-RT-UI-106": { er: 4000 },
  "NFR-ECOM-RT-UI-111": { er: 3000 },
};

(async () => {
  const browser = await chromium.launch({
    headless: false,
    logger: {
      isEnabled: (name, severity) => name === "browser",
      log: (name, severity, message, args) => console.log(`${name} ${message}`),
    },
  });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    // recordVideo: { dir: "videos/" },
  });
  try {
    await context.tracing.start({ screenshots: true, snapshots: true });
    const page = await context.newPage();

    let nfrName = "NFR-ECOM-RT-UI-101";
    let loadingStarted = Date.now();
    await page.goto(`${baseUrl}/product-lines/internet`, { timeout: 60000 });
    await page.locator(".related-offerings-and-lines-section__row").waitFor();
    let loadingEnded = Date.now();
    console.log(
      nfrName,
      `product lines block appeared in ${
        loadingEnded - loadingStarted
      } ms. Expected ${nfrs[nfrName].er} ms`
    );

    await page.click('"Да"'); //confirm city
    await page.click('"Хорошо"'); //accept cookies

    //select city
    await page.click(
      ".header-menu__info " +
        ".current-settlement " +
        ".current-settlement__name"
    );
    let cityInput = page.locator(
      ".city-selector " + "input.ant-select-selection-search-input"
    );
    await cityInput.click();
    await cityInput.fill(city);
    const cityAlreadySet = (await page.locator(`"${city}"`).count()) > 0;
    if (cityAlreadySet) {
      await page.click(".rc-virtual-list " + ".ant-select-item-option-content");
    } else {
      await Promise.all([
        page.click(".rc-virtual-list " + ".ant-select-item-option-content"),
        page.waitForNavigation(),
      ]);
    }

    nfrName = "NFR-ECOM-RT-UI-103";
    // loadingStarted = Date.now();
    // await page
    //   .locator(".product-line-list-container")
    //   .locator('"Интернет Базовый"')
    //   .click();
    const internetBaseLocator = page
      .locator(".product-line-list-container")
      .locator('"Интернет Базовый"');
    await internetBaseLocator.waitFor();
    loadingStarted = Date.now();
    await internetBaseLocator.click();
    await page.locator(".main-summary-product").waitFor();
    loadingEnded = Date.now();
    console.log(
      nfrName,
      `summary block appeared in ${
        loadingEnded - loadingStarted
      } ms. Expected ${nfrs[nfrName].er} ms`
    );

    nfrName = "NFR-ECOM-RT-UI-106";
    await page
      .locator(
        ".summary-block-product-info " +
          ".product-configuration__description-price-total " +
          ".taParam " +
          ".price"
      )
      .waitFor();
    loadingEnded = Date.now();
    console.log(
      nfrName,
      `summary block appeared in ${
        loadingEnded - loadingStarted
      } ms. Expected ${nfrs[nfrName].er} ms`
    );

    const addressInput = page.locator(
      ".taSelect.address-select " + "input.ant-select-selection-search-input"
    );
    await addressInput.click();
    await addressInput.fill(address);

    const addressSelector = ".ant-select-item-option-content";
    if (cityAlreadySet) {
      await page.click(addressSelector);
    } else {
      await Promise.all([
        page.click(addressSelector),
        page.waitForNavigation(),
      ]);
    }

    const priceLocator = page.locator(
      ".main-summary-product " +
        ".summary-block-product-info " +
        ".product-configuration__description-price-total " +
        ".price__from-value"
    );
    await priceLocator.waitFor({ state: "hidden" });
    await priceLocator.waitFor();

    nfrName = "NFR-ECOM-RT-UI-111";
    const addToCartLocator = page.locator('"Добавить в корзину"');
    await addToCartLocator.waitFor();
    loadingStarted = Date.now();
    await addToCartLocator.click();
    await page.locator('"Перейти в корзину"').waitFor();
    loadingEnded = Date.now();
    console.log(
      nfrName,
      `product added to cart in ${loadingEnded - loadingStarted} ms. Expected ${
        nfrs[nfrName].er
      } ms`
    );

    await page.click('"Войти"');

    await page.waitForTimeout(1000);
    const ecomLoginIFrame = await page.frameLocator("#ecomLoginIFrame");
    await ecomLoginIFrame.locator("#username").fill(username);
    await ecomLoginIFrame.locator("#password").fill(password);
    await ecomLoginIFrame.locator('"Sign In"').click();
    await ecomLoginIFrame.locator(".kc-feedback-text").waitFor();

    await page.waitForTimeout(1000);
  } catch (e) {
    console.log("ERROR", e);
  } finally {
    await context.tracing.stop({ path: "trace.zip" });
    await browser.close();
  }
})();
