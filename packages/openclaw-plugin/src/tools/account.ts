/**
 * Account tools for monday.com
 * Tools: monday_get_account_info
 */

import { Type, type Static } from "@sinclair/typebox";
import type { MondayClient } from "../monday-client.js";

// --- Schemas ---

export const GetAccountInfoParams = Type.Object({});

// --- Tool Implementations ---

export async function getAccountInfo(
  client: MondayClient,
  _params: Static<typeof GetAccountInfoParams>
) {
  const data = await client.query(
    `
    query {
      me {
        id
        name
        email
        is_admin
        is_guest
        created_at
        account {
          id
          name
          slug
          plan {
            period
            tier
            version
          }
          first_day_of_the_week
          country_code
        }
        teams {
          id
          name
        }
      }
    }
    `
  );

  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data.me, null, 2),
      },
    ],
  };
}
