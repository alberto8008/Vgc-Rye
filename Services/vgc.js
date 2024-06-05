import { GraphQLClient, gql } from "graphql-request";
import {
  productPublishMutation,
  updateProductMutation,
  variantPriceSetMutation,
} from "../Graphql/mutation.js";
import {
  fetchProductIDFromHandleQuery,
  getPublicationsQuery,
} from "../Graphql/query.js";
import {
  fetchAmazonProductsFromRYE,
  fetchShopifyProductsFromRYE,
} from "./rye.js";
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

const getPublications = async () => {
  const getPublicationsQueryResponse = await VGCClient.request(
    getPublicationsQuery,
    {}
  );
  return getPublicationsQueryResponse.publications.edges;
};

export const createShopifyProductsOnStore = async (productUrls) => {
  let numberOfCreatedProducts = 0;
  const ryeProducts = await fetchShopifyProductsFromRYE(productUrls);
  const publications = await getPublications();

  await mongoClient.connect();
  const dbo = mongoClient.db("shopify-rye");

  await Promise.all(
    ryeProducts.map(async (element) => {
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
          status: "ACTIVE",
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

      // Publish the product to sales channels
      await Promise.all(
        publications.map(async (publication) => {
          const productPublishMutationVariables = {
            id: productCreateResponse.productCreate.product.id,
            input: {
              publicationId: publication.node.id,
            },
          };
          return await VGCClient.request(
            productPublishMutation,
            productPublishMutationVariables
          );
        })
      );

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

export const createAmazonProductsOnStore = async (productUrls) => {
  let numberOfCreatedProducts = 0;
  const ryeProducts = await fetchAmazonProductsFromRYE(productUrls);
  const publications = await getPublications();

  await mongoClient.connect();
  const dbo = mongoClient.db("shopify-rye");

  await Promise.all(
    ryeProducts.map(async (element) => {
      const productCreateMutation = gql`
        mutation productCreate(
          $input: ProductInput!
          $media: [CreateMediaInput!]
        ) {
          productCreate(input: $input, media: $media) {
            product {
              id
              handle
              variants(first: 5) {
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
          title: element.amazonItem1.title,
          descriptionHtml: element.amazonItem1.featureBullets.join(" "),
          vendor: element.amazonItem1.vendor,
          tags: element.amazonItem1.tags.join(","),
          status: "ACTIVE",
        },
        media: element.amazonItem1.images.map((image) => ({
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

      console.log(`${numberOfCreatedProducts}: ${element.amazonItem1.title}`);

      try {
        await dbo.collection("variant-mapping").insertOne(
          {
            vgcVariantId:
              productCreateResponse.productCreate.product.variants.nodes[0].id.split(
                "Variant/"
              )[1],
            ryeVariantId: element.amazonItem1.id,
            // originalSource:
          },
          (err, res) => {
            if (err) throw err;
          }
        );
      } catch (err) {
        console.log(err);
      }

      // Publish the product to sales channels
      await Promise.all(
        publications.map(async (publication) => {
          const productPublishMutationVariables = {
            id: productCreateResponse.productCreate.product.id,
            input: {
              publicationId: publication.node.id,
            },
          };
          return await VGCClient.request(
            productPublishMutation,
            productPublishMutationVariables
          );
        })
      );

      productCreateResponse.productCreate.product.variants.nodes.forEach(
        (variant) => variants.push(variant.id)
      );

      variants.forEach(async (variant) => {
        const variantPriceSetMutationVariables = {
          input: {
            id: variant,
            price: element.amazonItem1.price.value / 100 + 1,
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
