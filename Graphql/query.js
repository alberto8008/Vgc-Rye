import { gql } from "graphql-request";

export const ryeFetchShopifyProductsQuery = gql`
  query DemoShopifyProductFetch($input: ProductByIDInput!) {
    product: productByID(input: $input) {
      id
      marketplace
      title
      description
      vendor
      url
      isAvailable
      tags
      images {
        url
      }
      variants {
        ... on ShopifyVariant {
          id
          price
        }
        title
        image {
          url
          ... on ShopifyImage {
            position
            width
            height
          }
        }
      }
      price {
        currency
        displayValue
        value
      }
      ... on ShopifyProduct {
        descriptionHTML
        collectionHandle
        handle
        maxPrice
        minPrice
        productType
        createdAt
        publishedAt
        storeCanonicalURL
        reviewsConnection(first: 5) {
          pageInfo {
            endCursor
            hasNextPage
          }
          edges {
            node {
              id
              body
              helpfulnessCount
              rating
              submittedAt
              reviewerDisplayName
              merchantReply
            }
          }
        }
      }
    }
  }
`;

export const fetchProductIDFromHandleQuery = gql`
  query getProductIdFromHandle($handle: String!) {
    productByHandle(handle: $handle) {
      id
    }
  }
`;
