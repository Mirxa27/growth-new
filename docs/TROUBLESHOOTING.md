# Troubleshooting Playbook

This guide provides solutions to common problems you may encounter when working with the Realtime Voice Agent.

## Common Errors

### "No client secret received from OpenAI"

This error indicates that the `get-realtime-token` edge function is unable to get a token from OpenAI.

**Possible Causes:**

-   **Invalid OpenAI API key:** Check that your `OPENAI_API_KEY` environment variable is correct.
-   **Insufficient OpenAI credits:** Check that you have sufficient credits in your OpenAI account.
-   **OpenAI API outage:** Check the [OpenAI status page](https://status.openai.com/) for any ongoing incidents.

### Controlled/uncontrolled input warnings

These warnings occur when a React component's input value is `undefined`.

**Solution:**

The `Input` and `Textarea` components have been updated to handle this, but you may still see warnings in some cases. To fix this, ensure that you are providing a default value for your inputs, for example:

```tsx
<Input value={myValue ?? ''} onChange={...} />
```

### WebRTC connection issues

WebRTC connection issues can be difficult to debug.

**Possible Causes:**

-   **Firewall restrictions:** Check that your firewall is not blocking UDP traffic.
-   **NAT traversal issues:** You may need to configure a TURN server to relay traffic between peers.

## Debugging

### Structured Logging

The `get-realtime-token` edge function uses structured logging to provide detailed information about each request. You can view the logs in your Supabase project under **Edge Functions** > **get-realtime-token**.

### Metrics

The `get-realtime-token` edge function also sends metrics to the console. You can view these metrics in your browser's developer console.