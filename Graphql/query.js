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

export const ryeFetchAmazonProductsQuery = gql`
  query DemoAmazonShopifyProductFetch($input: ProductByIDInput!) {
    amazonItem1: productByID(input: $input) {
      id
      title
      marketplace
      description
      vendor
      url
      isAvailable
      tags
      images {
        url
      }
      variants {
        title
      }
      price {
        currency
        displayValue
        value
      }
      ... on AmazonProduct {
        ASIN
        titleExcludingVariantName
        categories {
          name
          url
        }
        featureBullets
        parentID
        protectionPlans {
          title
          price {
            value
            currency
            displayValue
          }
          id
        }
        ratingsTotal
        reviewsTotal
        marketplace
        variants {
          title
          image {
            url
            ... on AmazonImage {
              position
              width
              height
            }
          }
        }
        subtitle {
          text
          url
        }
        videos {
          durationSeconds
          width
          height
          url
          thumbnailURL
          title
        }
        specifications {
          name
          value
        }
        color
        manufacturer
        weight
        firstAvailable
        dimensions
        modelNumber
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

export const getPublicationsQuery = gql`
  query publications {
    publications(first: 5) {
      edges {
        node {
          id
          name
          supportsFuturePublishing
          app {
            id
            title
            description
            developerName
          }
        }
      }
    }
  }
`;
