const puppeteer = require('puppeteer');
const xlsx = require('xlsx');

(async () => {
    //URL a donde va a ir a buscar elementos
    const URL = "https://www.amazon.com/-/es/s?k=iphone&language=es&__mk_es_US=%Chttps://www.amazon.com/s?k=portatiles&crid=16BH4R65SD64H&sprefix=%2Caps%2C1918&ref=nb_sb_ss_recent_3_0_recent";

    //Para abrir el navegador
    const browser = await puppeteer.launch({
        headless: false
    });

    const page = await browser.newPage();

    await page.goto(URL, { waitUntil: "networkidle2" });

    const title = await page.title();
    console.log(`Titulo de la página ` + title);

    //Escanear los productos de la página
    let products = [];
    let nextPage = true;

    //Ciclo para pasar a la siguiente página
    while(nextPage) {
        const newProducts = await page.evaluate(() => {
            const products = Array.from(document.querySelectorAll(".puis-card-container.s-card-container")); //Elemento class de un contenedor de la página

            return products.map((product) => {
                const title = product.querySelector(".a-size-mini ")?.innerText;
                const priceWhole = product.querySelector(".a-price-whole")?.innerText;
                const priceFraction = product.querySelector(".a-price-fraction")?.innerText;

                if(!priceWhole || !priceFraction) {
                    return {
                        title,
                        price: "N/A",
                    }
                }

                const priceWholeCleaned = priceWhole.replace(/\n/g, "").trim();
                const priceFractioncleaned = priceFraction.replace(/\n/g, "").trim();

                return {
                    title,
                    price: `${priceWholeCleaned}${priceFractioncleaned}`
                }
            })
        });

        products = [...products, ...newProducts];

        nextPage = await page.evaluate(() => {
            const nextButton = document.querySelector(".s-pagination-next");

            if(nextButton && !nextButton.classList.contains("s-pagination-disabled")) {
                nextButton.click();
                return true;
            }

            return false;
         });

         await new Promise((resolve) => setTimeout(resolve, 4000));
    }

    console.log(products);

    //Convertir a archivo Excel
    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(products);
    const path = "products.xlsx";

    xlsx.utils.book_append_sheet(wb, ws, "Products");
    xlsx.writeFile(wb, path);

    await browser.close();

})();