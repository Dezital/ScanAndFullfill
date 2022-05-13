import "isomorphic-fetch";
import { gql } from "apollo-boost";

export function RECURRING_CREATE(url,shop,host) {
  console.log(url);
  let oldurl=url
  let newurl=`/?shop=${shop}&host=${host}`
  let retUrl=oldurl.concat(newurl)

  return gql`
    mutation {
      appSubscriptionCreate(
          name: "Standard Plan"
          returnUrl: "${retUrl}"
          trialDays: 7
          lineItems: [
          {
            plan: {
              appUsagePricingDetails: {
                  cappedAmount: { amount: 15, currencyCode: USD }
                  terms: "$1 for 1000 emails"
              }
            }
          }
          {
            plan: {
              appRecurringPricingDetails: {
                  price: { amount: 15, currencyCode: USD }
              }
            }
          }
          ]
        ) {
            userErrors {
              field
              message
            }
            confirmationUrl
            appSubscription {
              id
            }
        }
    }`;
}

export const getSubscriptionUrl = async (client,shop,host) => {
 
  let cUrl;
   await client
    .mutate({
      mutation: RECURRING_CREATE(process.env.HOST,shop,host)
    })
    .then((response) => {
     cUrl= response.data.appSubscriptionCreate.confirmationUrl;
     });

  return cUrl;
};
