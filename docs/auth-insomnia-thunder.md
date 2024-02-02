# Getting an access token

This page will document how to configure _Thunder Client_ and _Insomnia_ to use OAuth2.

You can use the user `test`/`test` for testing for now.

## Thunder Client

_Thunder_ can be easily configured to apply OAuth authentication to the entire collection.

1. Open the collection settings
2. Switch to the `Auth` tab
3. Select `OAuth 2`
4. Enter the following parameters

| Parameter     | Value                                                                               |
| ------------- | ----------------------------------------------------------------------------------- |
| Token Prefix  | `Bearer`                                                                            |
| Access Token  | leave blank, will be auto generated                                                 |
| Grant Type    | `Authorization Code`                                                                |
| Token URL     | `http://127.0.0.1:8080/realms/SPSH/protocol/openid-connect/token`                   |
| Callback URL  | `http://localhost:6789/callback` (Thunder listens here to retrieve generated token) |
| Client ID     | `spsh`                                                                              |
| Client Secret | `YDp6fYkbUcj4ZkyAOnbAHGQ9O72htc5M` (valid for the default configuration)            |

You can test the configuration by clicking `Generate Token` at the bottom of the page.

All requests will now use this authorization by default.

_You can also select `Password Credentials` for the `Grant Type` and enter your credentials directly, if you want to skip the manual auth flow_

## Insomnia

_Insomnia_ does not have the ability to define global auth. You can configure auth per request. Enable OAuth 2 for a request and see the section above for the correct parameters. Replace `Redirect URL` with `https://localhost:8099/` (Any redirect URL that keycloak knows about will work, since Insomnia handles token retrieval itself).

### Automating auth

With a bit of work you can configure Insomnia to behave similiar to Thunder, instead of manually defining auth for every request.

1. Create a request that gets an access token from keycloak:

    - Name it something like `Get Access Token`
    - POST Request to `http://127.0.0.1:8080/realms/SPSH/protocol/openid-connect/token`
    - Set Body to `Form`
        - client_id = `spsh`
        - username = `test`
        - password = `test`
        - grant_type = `password`
        - client_secret = `YDp6fYkbUcj4ZkyAOnbAHGQ9O72htc5M`

2. In your environment, add the configuration for `DEFAULT_HEADERS`.

```JSON
{
    "DEFAULT_HEADERS": {
		"Authorization": "Bearer {% response 'body', '', 'b64::JC5hY2Nlc3NfdG9rZW4=::46b', 'when-expired', 300 %}"
	},
    ...
}
```

3. Click on the red tag
    - select the request you created in step 1 (under `Request`)

Now the `Authorization` header on every request will be automatically set.

## Troubleshooting

### Keycloak shows `Invalid parameter: redirect_uri`

Make sure you have an up-to-date keycloak realm. Either completely delete and restart the keycloak container (will reimport the default realm) or use the admin-ui to delete the realm and restart keycloak

### Thunder fails to update token

If keycloak restarts, old tokens will be invalidated. You may need to click the "Generate Token"-Button manually to reset the process.
