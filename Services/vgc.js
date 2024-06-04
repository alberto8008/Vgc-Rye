import { GraphQLClient, gql } from "graphql-request";
import {
  updateProductMutation,
  variantPriceSetMutation,
} from "../Graphql/mutation.js";
import { fetchProductIDFromHandleQuery } from "../Graphql/query.js";
import { fetchProductsFromRYE } from "./rye.js";
import { config } from "dotenv";
import { MongoClient, ServerApiVersion } from "mongodb";

config();

const VGCClient = new GraphQLClient(process.env.VGC_GRAPHQL_ENDPOINT, {
  headers: {
    "X-Shopify-Access-Token": process.env.VGC_ACCESS_TOKEN,
    "Content-Type": "application/json",
  },
});

const mongoClient = new MongoClient(process.env.MONGO_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

export const createProductsOnStore = async (productUrls) => {
  let numberOfCreatedProducts = 0;
  const ryeProducts = await fetchProductsFromRYE(productUrls);

  await mongoClient.connect();
  const dbo = mongoClient.db("shopify-rye");

  await Promise.all(
    ryeProducts.map(async (element) => {
      console.log(element.product);
      const productCreateMutation = gql`
                    mutation productCreate(
                      $input: ProductInput!
                      $media: [CreateMediaInput!]
                    ) {
                      productCreate(input: $input, media: $media) {
                        product {
                          id
                          handle
                          variants(first: ${element.product.variants.length}) {
                            nodes {
                              id
                              title
                              selectedOptions {
                                name
                                value
                              }
                            }
                          }
                        }
                        userErrors {
                          field
                          message
                        }
                      }
                    }
                  `;

      const productCreateMutationVariables = {
        input: {
          title: element.product.title,
          descriptionHtml: element.product.descriptionHTML,
          vendor: element.product.vendor,
          productType: element.product.productType,
          tags: element.product.tags.join(","),
          handle: element.product.handle,
        },
        media: element.product.images.map((image) => ({
          originalSource: image.url,
          mediaContentType: "IMAGE",
        })),
      };

      const variants = [];
      const productCreateResponse = await VGCClient.request(
        productCreateMutation,
        productCreateMutationVariables
      );
      if (productCreateResponse.userErrors)
        console.log(
          variantPriceSetResponse.userErrors.field,
          variantPriceSetResponse.userErrors.message
        );
      else numberOfCreatedProducts++;

      console.log(`${numberOfCreatedProducts}: ${element.product.title}`);

      try {
        await dbo.collection("variant-mapping").insertOne(
          {
            vgcVariantId:
              productCreateResponse.productCreate.product.variants.nodes[0].id.split(
                "Variant/"
              )[1],
            ryeVariantId: element.product.variants[0].id,
            // originalSource:
          },
          (err, res) => {
            if (err) throw err;
          }
        );
      } catch (err) {
        console.log(err);
      }

      productCreateResponse.productCreate.product.variants.nodes.forEach(
        (variant) => variants.push(variant.id)
      );

      variants.forEach(async (variant) => {
        const variantPriceSetMutationVariables = {
          input: {
            id: variant,
            price: element.product.price.value / 100 + 1,
          },
        };

        const variantPriceSetResponse = await VGCClient.request(
          variantPriceSetMutation,
          variantPriceSetMutationVariables
        );
        if (variantPriceSetResponse.userErrors)
          console.log(
            variantPriceSetResponse.userErrors.field,
            variantPriceSetResponse.userErrors.message
          );
      });
      return true;
    })
  );

  await mongoClient.close();

  return numberOfCreatedProducts;
};

export const updateProductOnStore = async (productInfo) => {
  const fetchProductIDFromHandleQueryVariable = {
    handle: productInfo.handle,
  };
  const fetchProductIDFromHandleQueryResponse = await VGCClient.request(
    fetchProductIDFromHandleQuery,
    fetchProductIDFromHandleQueryVariable
  );

  const updateProductMutationVariables = {
    input: {
      id: fetchProductIDFromHandleQueryResponse.productUpdate.product.id,
      title: productInfo.title,
      descriptionHtml: productInfo.descriptionHtml,
      vendor: productInfo.vendor,
      productType: productInfo.productType,
      tags: productInfo.tags.join(","),
    },
    media: productInfo.images.map((image) => ({
      originalSource: image.url,
      mediaContentType: "IMAGE",
    })),
  };

  const updateProductMutationResponse = await VGCClient.request(
    updateProductMutation,
    updateProductMutationVariables
  );

  if (updateProductMutationResponse.productUpdate.userErrors.length > 0)
    return false;
  return true;
};
