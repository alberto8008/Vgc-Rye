import { GraphQLClient, gql } from "graphql-request";
import {
  ryeFetchAmazonProductsQuery,
  ryeFetchShopifyProductsQuery,
} from "../Graphql/query.js";
import { config } from "dotenv";
import { createCartMutation } from "../Graphql/mutation.js";
import { MongoClient, ServerApiVersion } from "mongodb";

config();

const RYEClient = new GraphQLClient(process.env.RYE_GRAPHQL_ENDPOINT, {
  headers: {
    Authorization: process.env.RYE_AUTHORIZATION,
    "Rye-Shopper-IP": process.env.RYE_SHOPPER_IP,
  },
});

const mongoClient = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export const fetchShopifyProductsFromRYE = async (productUrls) => {
  console.log("rye url counts:", productUrls.length);
  const ryeProductIds = await Promise.all(
    productUrls.map(async (url) => {
      const ryeFetchShopifyProductIdMutation = gql`
                      mutation RequestShopifyProductByURL {
                          requestShopifyProductByURL(
                          input: {
                              url: "${url}"
                          }
                          ) {
                          canonicalDomain
                          productId
                          }
                      }
                  `;
      return await RYEClient.request(ryeFetchShopifyProductIdMutation, {});
    })
  );

  const ryeProducts = await Promise.all(
    ryeProductIds.map(async (product) => {
      const ryeFetchProductsQueryVariable = {
        input: {
          id: product.requestShopifyProductByURL.productId,
          marketplace: "SHOPIFY",
        },
      };

      return await RYEClient.request(
        ryeFetchShopifyProductsQuery,
        ryeFetchProductsQueryVariable
      );
    })
  );

  return ryeProducts;
};

export const fetchAmazonProductsFromRYE = async (productUrls) => {
  console.log("rye url counts:", productUrls.length);
  const ryeProductIds = await Promise.all(
    productUrls.map(async (url) => {
      const ryeFetchAmazonProductIdMutation = gql`
                      mutation RequestAmazonProductByURL {
                        requestAmazonProductByURL(
                          input: {
                              url: "${url}"
                          }
                          ) {
                          productId
                          }
                      }
                  `;
      return await RYEClient.request(ryeFetchAmazonProductIdMutation, {});
    })
  );

  const ryeProducts = await Promise.all(
    ryeProductIds.map(async (product) => {
      const ryeFetchProductsQueryVariable = {
        input: {
          id: product.requestAmazonProductByURL.productId,
          marketplace: "AMAZON",
        },
      };

      return await RYEClient.request(
        ryeFetchAmazonProductsQuery,
        ryeFetchProductsQueryVariable
      );
    })
  );

  return ryeProducts;
};

export const makeOrder = async (orderInfo) => {};

const getRyeVariantsFromVgcVariants = async (vgcVariants) => {
  await mongoClient.connect();
  const dbo = mongoClient.db("shopify-rye");
  const collection = dbo.collection("variant-mapping");
  const cartItems = [];

  await Promise.all(
    vgcVariants.map(async (variant) => {
      const item = await collection.findOne({
        vgcVariantId: variant.variant_id.toString(),
      });
      if (item)
        cartItems.push({
          quantity: variant.quantity,
          variantId: item.ryeVariantId,
        });
      return true;
    })
  );

  await mongoClient.close();

  return cartItems;
};

export const calculateShipping = async (shippingInfo, lineItems) => {
  const cartItems = await getRyeVariantsFromVgcVariants(lineItems);
  const createCartVariables = {
    input: {
      items: {
        shopifyCartItemsInput: cartItems.filter(
          (item) => parseInt(item.variantId) !== NaN
        ),
        amazonCartItemsInput: cartItems.filter(
          (item) => parseInt(item.variantId) === NaN
        ),
      },
      buyerIdentity: shippingInfo,
    },
  };

  const createCartMutationResponse = await RYEClient.request(
    createCartMutation,
    createCartVariables
  );

  let shippingCost = 0;
  if (createCartMutationResponse.createCart.errors.length === 0)
    createCartMutationResponse.createCart.cart.stores.forEach(
      (store) => (shippingCost += store.offer.shippingMethods[0].price.value)
    );

  return shippingCost;
};
