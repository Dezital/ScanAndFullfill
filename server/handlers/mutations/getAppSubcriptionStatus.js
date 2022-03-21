import { gql } from "apollo-boost";

const GET_SUBSCRIPTION = gql`
  query {
    currentAppInstallation {
      activeSubscriptions {
        status
      }
    }
  }
`;
export const getAppSubscriptionStatus = async (client) => {
  // const { client } = ctx;
  const isActive = await client
    .query({
      query: GET_SUBSCRIPTION,
    })
    .then((response) => {
      if (response.data.currentAppInstallation.activeSubscriptions.length) {
        return (
          response.data.currentAppInstallation.activeSubscriptions[0].status ===
          "ACTIVE"
        );
      } else return false;
    });

  return isActive;
};