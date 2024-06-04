import { GraphQLClient, gql } from "graphql-request";
import { ryeFetchShopifyProductsQuery } from "../Graphql/query.js";
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

export const fetchProductsFromRYE = async (productUrls) => {
  console.log("rye url counts:", productUrls.length);
  const ryeProductIds = await Promise.all(
    productUrls.map(async (url) => {
      const ryeFetchProductIdMutation = gql`
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
      return await RYEClient.request(ryeFetchProductIdMutation, {});
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

export const makeOrder = async (orderInfo) => {};

export const getRyeVariantFromVgcVariant = async (vgcVariant) => {
  try {
    await mongoClient.connect();
    const dbo = mongoClient.db("shopify-rye");
    const collection = dbo.collection("variant-mapping");

    const query = { vgcVariantId: vgcVariant };
    const item = await collection.findOne(query);
    console.log(item);

    await mongoClient.close();
    return item ? item.ryeVariantId : null;
  } catch (err) {
    console.log(err);
  }
};

export const calculateShipping = async (shippingInfo, cartItems) => {
  const createCartVariables = {
    input: {
      items: {
        shopifyCartItemsInput: cartItems,
      },
      buyerIdentity: shippingInfo,
    },
  };

  const createCartMutationResponse = await RYEClient.request(
    createCartMutation,
    createCartVariables
  );

  return createCartMutationResponse.data.createCart.cart.stores.offer
    .shippingMethods;
};
