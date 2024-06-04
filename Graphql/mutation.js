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
