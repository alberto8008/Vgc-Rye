import { gql } from "graphql-request";

export const variantPriceSetMutation = gql`
  mutation VariantPriceUpdate($input: ProductVariantInput!) {
    productVariantUpdate(input: $input) {
      productVariant {
        id
        price
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const updateProductMutation = gql`
  mutation productUpdate($input: ProductInput!, $media: [CreateMediaInput!]) {
    productUpdate(input: $input, media: $media) {
      product {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const createCartMutation = gql`
  mutation ($input: CartCreateInput!) {
    createCart(input: $input) {
      cart {
        cost {
          isEstimated
          subtotal {
            value
            displayValue
            currency
          }
          tax {
            value
            displayValue
            currency
          }
          shipping {
            value
            displayValue
            currency
          }
          total {
            value
            displayValue
            currency
          }
        }
        id
        stores {
          ... on ShopifyStore {
            errors {
              code
              message
              details {
                variantIds
              }
            }
            store
            cartLines {
              quantity
              variant {
                id
              }
            }
            offer {
              errors {
                code
                message
                details {
                  ... on ShopifyOfferErrorDetails {
                    variantIds
                  }
                }
              }
              subtotal {
                value
                displayValue
                currency
              }
              margin {
                value
                displayValue
                currency
              }
              notAvailableIds
              shippingMethods {
                id
                label
                price {
                  value
                  displayValue
                  currency
                }
                taxes {
                  value
                  displayValue
                  currency
                }
                total {
                  value
                  displayValue
                  currency
                }
              }

              selectedShippingMethod {
                id
                label
                price {
                  value
                  displayValue
                  currency
                }
                taxes {
                  value
                  displayValue
                  currency
                }
                total {
                  value
                  displayValue
                  currency
                }
              }
            }
          }
        }
      }
      errors {
        code
        message
      }
    }
  }
`;

export const productPublishMutation = gql`
  mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      publishable {
        availablePublicationsCount {
          count
        }
        resourcePublicationsCount {
          count
        }
      }
      shop {
        publicationCount
      }
      userErrors {
        field
        message
      }
    }
  }
`;

export const submitCartMutation = gql`
  mutation SubmitCart($input: CartSubmitInput!) {
    submitCart(input: $input) {
      cart {
        id
        stores {
          status
          orderId
          store {
            ... on AmazonStore {
              store
              cartLines {
                quantity
                product {
                  id
                }
              }
            }
            ... on ShopifyStore {
              store
              cartLines {
                quantity
                variant {
                  id
                }
              }
            }
          }
          errors {
            code
            message
          }
        }
      }
      errors {
        code
        message
      }
    }
  }
`;
