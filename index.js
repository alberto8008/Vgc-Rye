import express from "express";
import bodyParser from "body-parser";
import cors from "cors";
import { config } from "dotenv";
import {
  createAmazonProductsOnStore,
  createShopifyProductsOnStore,
  updateProductOnStore,
} from "./Services/vgc.js";
import { calculateShipping, submitRyeCart } from "./Services/rye.js";

config();

const app = express();
const port = 3001;

app.use(bodyParser.json());
app.use(cors());

app.post("/import-shopify-products", async (req, res) => {
  if (req.body.product_urls.length > 0) {
    const importedProductCounts = await createShopifyProductsOnStore(
      req.body.product_urls
    );
    return res.status(200).json({
      "number of imported products": importedProductCounts,
      "number of required products": req.body.product_urls.length,
    });
  }
  return res.status(422).json({ error: "No urls provided" });
});

app.post("/import-amazon-products", async (req, res) => {
  if (req.body.product_urls.length > 0) {
    const importedProductCounts = await createAmazonProductsOnStore(
      req.body.product_urls
    );
    return res.status(200).json({
      "number of imported products": importedProductCounts,
      "number of required products": req.body.product_urls.length,
    });
  }
  return res.status(422).json({ error: "No urls provided" });
});

app.post("/rye-webhooks", async (req, res) => {
  console.log("rye webhook received");

  switch (req.body.type) {
    case "PRODUCT_UPDATED":
      const result = await updateProductOnStore(req.body.data.product);
      if (result) return res.status(200).send("Product updated");
      break;
    default:
      break;
  }
});

// app.post("/", (req, res) => {
//   console.log("rye webhook received");
//   console.log(req.body);
//   // Create a SHA-256 HMAC with the shared secret key
//   const hmac = crypto.createHmac("sha256", SECRET_KEY);

//   // Update the HMAC with the request body
//   // req.body represents the POST body as a string, assuming that it hasn't been parsed to JSON
//   // hmac.update(req.body);
//   return res.status(200);

//   // Compare the base64 HMAC digest against the signature passed in the header
//   if (hmac.digest("base64") !== req.headers["rye-hmac-signature-v1"]) {
//     // The request is not authentic
//     return res.status(401).send("Unauthorized");
//   }
// });

app.post("/vgc-order-paid", (req, res) => {
  const orderInfo = {
    id: req.body.id,
    products: req.body.line_items,
    billingInfo: req.body.billing_address,
  };
});

app.post("/vgc-shipping", async (req, res) => {
  console.log(req.body);
  const shippingInfo = {
    firstName: req.body.rate.destination.name.split(" ")[0],
    lastName: req.body.rate.destination.name.split(" ")[1],
    email: req.body.rate.destination.email,
    phone: req.body.rate.destination.phone,
    address1: req.body.rate.destination.address1,
    city: req.body.rate.destination.city,
    provinceCode: req.body.rate.destination.province,
    countryCode: req.body.rate.destination.country,
    postalCode: req.body.rate.destination.postal_code,
  };
  const shippingCost = await calculateShipping(
    shippingInfo,
    req.body.rate.items
  );

  const response = {
    rates: [
      {
        service_name: "Rye Standard Shipping",
        service_code: "standard",
        description: "Standard Shipping",
        total_price: shippingCost,
        currency: req.body.rate.currency,
      },
    ],
  };
  console.log(response);

  res.send(response);
});

app.post("/vgc-order-payment", async (req, res) => {
  const shippingInfo = {
    firstName: req.body["shipping_address"]["first_name"],
    lastName: req.body["shipping_address"]["last_name"],
    email: req.body.email,
    phone: req.body["shipping_address"]["phone"],
    address1: req.body["shipping_address"]["address1"],
    city: req.body["shipping_address"]["city"],
    provinceCode: req.body["shipping_address"]["province_code"],
    countryCode: req.body["shipping_address"]["country_code"],
    postalCode: req.body["shipping_address"]["zip"],
  };

  const response = await submitRyeCart(shippingInfo, req.body.line_items);
  return res.send(200);
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
