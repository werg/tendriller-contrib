# Deploy the assistant connection

Serve the application MCP endpoint at the existing Tendriller service origin.
The selected page's Durable Object stores an enrolled assistant device and
encrypted delivery state. The application's own coordinator stays available for
normal browser and assistant reads and writes.

1. Create and claim a kitchen version 2 page. Keep its current coordinator
   available and publish the signed application UI.
2. Apply the account OAuth migration and configure the exact service origin plus
   `/mcp` as the OAuth resource. Register the intended client's callback and
   authentication method. Store signing and assistant secrets in the Worker.
3. Configure the claimed page ID, a dedicated page agent token, a delivery
   encryption key and approved HTTPS callback origins.
4. Provision the Worker's public device key and enroll it for the kitchen
   domain's reader/writer grants. Keep creator, coordination and publishing
   authority with their existing devices.
5. Enable the assistant wake notices on the kitchen coordinator. It sends a
   short authenticated notice after a relevant committed change. The Worker
   reads from its saved cursor and delivers signed metadata to the allowed
   callback. Its page alarm handles retries.
6. Sign in at `/connections`, approve the queries, commands and events, then
   link `/mcp` in the intended client. Verify one real page request, one matching
   assistant reply, and the effect of revoking the account connection.

Use the pinned [Worker setup guide](https://github.com/werg/tendriller/blob/149ec6572992955f33fff995a2f7e69f1c3e7059/docs/CLOUDFLARE_ASSISTANT.md)
for the exact settings and [OAuth guide](https://github.com/werg/tendriller/blob/149ec6572992955f33fff995a2f7e69f1c3e7059/docs/INTEGRATION_OAUTH.md)
for client registration. Keep the encryption key recoverable. Delivery jobs and
their replay or recovery state depend on it.

| Observation | What it establishes |
| --- | --- |
| Successful authenticated query | The client, owner consent and current native read grant permit the requested view |
| Signed webhook acknowledged | The receiver accepted the event envelope |
| Signed reply in selected history | The application has the correlated response |
| No additional work in a matched idle window | The assistant integration did not add requests, alarms or execution duration during that window |

The [evidence record](evidence.md) identifies the local Worker test and historical
release results. Qualify live OAuth, subscriptions and Cloudflare billing on
staging with a separately registered client.
