import { Callout, Code, Compare, EndpointBar, H2, H3, L, Table, DefList, Steps } from '../../components/docs.jsx';
import {
  JwtFlowDiagram, JwtStructureDiagram, LogoutFlowDiagram, RefreshFlowDiagram, TokenLifecycleDiagram,
} from '../../diagrams/index.jsx';
import { CODE } from '../../lib/source.js';

const GROUP = 'JWT Authentication';

/* ------------------------------------------------------------------ */
function Concepts() {
  return (
    <>
      <H2>What is authentication?</H2>
      <p>
        Authentication proves who is making a request. HTTP is stateless: the server does not remember previous requests, so
        every request must prove its identity again. There are two common strategies:
      </p>
      <Compare
        left={{ title: 'Session (cookie) authentication', body: <p>After login the server stores a session record and gives the browser a session id cookie. Each request sends the cookie; the server looks the session up in its database. This is the default for Django websites.</p> }}
        right={{ title: 'Token authentication (JWT)', body: <p>After login the server issues a signed token. The client sends it in the <code>Authorization</code> header. The server verifies the signature; no session lookup is needed. This suits APIs used by mobile apps, SPAs and other services.</p> }}
      />
      <p>This project uses JWT through the <strong>Simple JWT</strong> package.</p>

      <H2>What is JWT?</H2>
      <p>
        A <strong>JSON Web Token</strong> (RFC 7519) is a compact, URL-safe string that carries a set of claims (facts such as “this is
        user 1” and “valid until 15:10 UTC”) together with a cryptographic signature. Anyone can read the claims, but only a
        holder of the signing key can create a valid signature. If a single character of the payload changes, verification
        fails.
      </p>
      <Callout type="warning" title="Encoded, not encrypted">
        The payload is base64url-encoded, which anyone can decode. Never put passwords or private data in a JWT. Simple JWT only
        stores the user id, token type, timestamps and a unique id.
      </Callout>

      <H2>JWT structure</H2>
      <p>A token is three base64url segments separated by dots: <code>header.payload.signature</code>.</p>
      <JwtStructureDiagram />
      <p>This is the decoded payload of a real access token issued by this project:</p>
      <Code lang="json" file="Decoded access-token payload">{`
{
  "token_type": "access",
  "exp": 1795359626,
  "iat": 1795357826,
  "jti": "e1c239c731c04a71b20f69d520fe11f4",
  "user_id": "1"
}
`}</Code>
      <Table head={['Claim', 'Meaning']} rows={[
        [<code>token_type</code>, <><code>"access"</code> or <code>"refresh"</code>. Stops a refresh token from being used as an access token, and vice versa.</>],
        [<code>exp</code>, 'Expiry time as a Unix timestamp. Here exp − iat = 1800 seconds = 30 minutes.'],
        [<code>iat</code>, '“Issued at” time.'],
        [<code>jti</code>, 'A unique token id. The blacklist stores this value.'],
        [<code>user_id</code>, 'The primary key of the user, stored as a string by Simple JWT 5.5.'],
      ]} />

      <H2>Access token</H2>
      <p>
        The access token is the credential sent with every protected request. It is short-lived, <strong>30 minutes</strong> in
        this project, which limits the damage if one leaks. The server verifies it without any database lookup for the token
        itself. That speed is also its weakness: an access token cannot be revoked before it expires.
      </p>
      <Code lang="http">{`
GET /api/products/ HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwi...
`}</Code>

      <H2>Refresh token</H2>
      <p>
        The refresh token is long-lived (<strong>1 day</strong> here) and has one purpose: obtaining new access tokens from
        <code> /api/token/refresh/</code>. It is never sent to product endpoints. Because the blacklist app is installed, a refresh
        token <em>can</em> be revoked, which is what logout does.
      </p>
      <Table head={['', 'Access token', 'Refresh token']} rows={[
        ['Lifetime', '30 minutes', '1 day'],
        ['Sent to', 'Every protected endpoint', <><code>/api/token/refresh/</code> and <code>/api/logout/</code> (in the body)</>],
        ['Where', <><code>Authorization: Bearer …</code> header</>, <>JSON body: <code>{'{"refresh": "…"}'}</code></>],
        ['Revocable', 'No, valid until exp', 'Yes, through blacklisting'],
        ['If stolen', 'Usable for at most 30 minutes', 'Usable until expiry or logout; protect it carefully'],
      ]} />

      <H2>How authentication works</H2>
      <JwtFlowDiagram />
      <Steps>
        <li><strong>Log in once.</strong> The client posts credentials to <code>/api/login/</code> and receives <code>refresh</code> and <code>access</code>.</li>
        <li><strong>Call the API.</strong> Each request includes <code>Authorization: Bearer &lt;access&gt;</code>. <code>JWTAuthentication</code> checks the signature and expiry, reads <code>user_id</code>, and loads the user from the database.</li>
        <li><strong>Refresh when needed.</strong> When a call returns 401 because the access token expired, the client posts the refresh token to <code>/api/token/refresh/</code> and retries with the new access token.</li>
        <li><strong>Log out.</strong> The client posts the refresh token to <code>/api/logout/</code>, which blacklists it, and deletes both tokens locally.</li>
      </Steps>
    </>
  );
}

/* ------------------------------------------------------------------ */
function SimpleJwtSetup() {
  return (
    <>
      <H2>Simple JWT installation</H2>
      <Code lang="bash">{`
pip install djangorestframework-simplejwt
`}</Code>
      <p>This also installs <strong>PyJWT</strong>, the library that does the actual encoding and signing. Then register the blacklist app and run its migrations:</p>
      <Code lang="python" file="backend/config/settings.py" code={CODE.installedApps} mark={['token_blacklist']} />
      <Code lang="bash">{`
python manage.py migrate
`}</Code>
      <p>
        The blacklist migrations create two tables: <code>token_blacklist_outstandingtoken</code> (every refresh token issued) and
        <code> token_blacklist_blacklistedtoken</code> (the revoked ones).
      </p>

      <H2>Authentication settings</H2>
      <Code lang="python" file="backend/config/settings.py" code={CODE.restAndJwt} lines />
      <DefList items={[
        ['JWTAuthentication', 'Registered as the only authentication class, so DRF reads identities exclusively from Bearer tokens.'],
        ['IsAuthenticated', 'Global default permission. Views must opt out explicitly.'],
        ['ACCESS_TOKEN_LIFETIME', '30 minutes instead of Simple JWT’s 5-minute default: a balance between security and convenience while testing.'],
        ['REFRESH_TOKEN_LIFETIME', '1 day, which is Simple JWT’s default, written out explicitly.'],
      ]} />
      <H3>Defaults that still apply</H3>
      <Table head={['Simple JWT setting', 'Default', 'Consequence here']} rows={[
        [<code>ALGORITHM</code>, <code>"HS256"</code>, 'Symmetric HMAC signature.'],
        [<code>SIGNING_KEY</code>, <code>settings.SECRET_KEY</code>, 'Changing SECRET_KEY invalidates every issued token.'],
        [<code>AUTH_HEADER_TYPES</code>, <code>("Bearer",)</code>, <>Header must be <code>Bearer &lt;token&gt;</code>.</>],
        [<code>ROTATE_REFRESH_TOKENS</code>, <code>False</code>, 'Refresh returns only a new access token.'],
        [<code>BLACKLIST_AFTER_ROTATION</code>, <code>False</code>, 'Irrelevant while rotation is off.'],
        [<code>UPDATE_LAST_LOGIN</code>, <code>False</code>, <><code>User.last_login</code> is not updated by API logins.</>],
        [<><code>USER_ID_FIELD</code> / <code>USER_ID_CLAIM</code></>,<><code>"id"</code> / <code>"user_id"</code></>, 'The token stores the user’s primary key.'],
      ]} />

      <H2>Token generation</H2>
      <p>The project does not write any token-generation code. Simple JWT’s <code>TokenObtainPairView</code>, mounted at <code>/api/login/</code>, does all of it:</p>
      <ol>
        <li><code>TokenObtainPairSerializer</code> validates that <code>username</code> and <code>password</code> are present.</li>
        <li>It calls Django’s <code>authenticate(username=…, password=…)</code>, which checks the password hash and that the user is active.</li>
        <li><code>RefreshToken.for_user(user)</code> creates a refresh token with <code>user_id</code>, <code>jti</code>, <code>iat</code>, <code>exp</code>. With the blacklist app installed, it also saves an <code>OutstandingToken</code> row.</li>
        <li><code>refresh.access_token</code> derives an access token with its own <code>jti</code> and a 30-minute <code>exp</code>.</li>
        <li>Both are returned as strings: <code>{'{"refresh": "…", "access": "…"}'}</code>.</li>
      </ol>
      <p>You can do the same from the Django shell, which is useful for debugging:</p>
      <Code lang="python" file="python manage.py shell">{`
from django.contrib.auth.models import User
from rest_framework_simplejwt.tokens import RefreshToken

user = User.objects.get(username="atlas_dev")
refresh = RefreshToken.for_user(user)

print(refresh.payload["token_type"])          # refresh
print(refresh.access_token.payload["exp"])   # Unix timestamp, 30 min from now
print(str(refresh.access_token)[:20])         # eyJhbGciOiJIUzI1NiIs
`}</Code>
    </>
  );
}

/* ------------------------------------------------------------------ */
function RegisterAndLogin() {
  return (
    <>
      <H2>Registration API</H2>
      <EndpointBar method="POST" path="/api/register/" auth={false} />
      <p>Registration is a regular function-based view. It is the only view in <code>views.py</code> that anonymous users may call.</p>
      <Code lang="python" file="backend/products/views.py" code={CODE.register} lines mark={['AllowAny', 'serializer.save()']} />
      <DefList items={[
        ['@permission_classes([AllowAny])', 'Overrides the global IsAuthenticated, otherwise nobody could ever create the first account.'],
        ['RegisterSerializer(data=request.data)', 'Create mode: only incoming data, no instance.'],
        ['serializer.save()', 'Calls RegisterSerializer.create(), which calls User.objects.create_user() to hash the password.'],
        ['serializer.data', 'The created user without the password (write_only), placed under "user".'],
        ['HTTP_201_CREATED', 'The standard status for a successfully created resource.'],
      ]} />
      <Code lang="json" file="Request · application/json">{`
{
  "username": "atlas_dev",
  "email": "dev@example.com",
  "password": "StrongPass#2026"
}
`}</Code>
      <Code lang="json" file="201 Created">{`
{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "atlas_dev",
    "email": "dev@example.com"
  }
}
`}</Code>
      <Callout type="warning">
        Registration does not enforce <code>AUTH_PASSWORD_VALIDATORS</code>: a password such as <code>"x"</code> is accepted. It also
        crashes with a 500 error if <code>email</code> is missing. Both are listed with fixes in
        <L to="best-practices/improvements" s="known-limitations-of-the-current-code"> Known limitations</L>.
      </Callout>

      <H2>Login API</H2>
      <EndpointBar method="POST" path="/api/login/" auth={false} />
      <p>Login has no custom view code. It is Simple JWT’s view mounted under a friendlier path:</p>
      <Code lang="python" file="backend/products/urls.py (excerpt)">{`
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView
)

urlpatterns = [
    ...
    path('login/', TokenObtainPairView.as_view(), name='token'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    ...
]
`}</Code>
      <Callout type="danger" title="Use /api/login/, not /api/token/">
        Most Simple JWT tutorials use <code>/api/token/</code>. In this project the obtain-pair view lives at <code>/api/login/</code>.
        The URL name is still <code>'token'</code>, which only matters for <code>reverse()</code> calls.
      </Callout>
      <Code lang="json" file="Request · application/json">{`
{
  "username": "atlas_dev",
  "password": "StrongPass#2026"
}
`}</Code>
      <Code lang="json" file="200 OK">{`
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIs...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwi..."
}
`}</Code>
      <Code lang="json" file="401 Unauthorized · wrong credentials">{`
{
  "detail": "No active account found with the given credentials"
}
`}</Code>
      <p>
        The error message is deliberately the same whether the username or the password is wrong, so an attacker cannot use
        it to find out which usernames exist. Full reference: <L to="api/login">POST /api/login/</L>.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
function LogoutAndBlacklisting() {
  return (
    <>
      <H2>Why logout needs a blacklist</H2>
      <p>
        With sessions, logout deletes the session on the server. JWTs have no server-side session to delete: a token stays
        valid until its <code>exp</code>. To make logout meaningful, the server must remember which refresh tokens have been
        revoked. That list is the <strong>blacklist</strong>.
      </p>

      <H2>Logout API</H2>
      <EndpointBar method="POST" path="/api/logout/" auth />
      <Code lang="python" file="backend/products/views.py" code={CODE.logout} lines mark={['RefreshToken(refresh_token)', 'token.blacklist()']} />
      <H3>Line by line</H3>
      <DefList items={[
        ['@permission_classes([IsAuthenticated])', 'Only a logged-in user, with a valid access token in the header, can log out.'],
        ["request.data.get('refresh')", 'Reads the refresh token from the JSON body. .get() returns None instead of raising when the key is missing.'],
        ['if not refresh_token', 'Explicit 400 with "Refresh token is required" for a missing or empty value.'],
        ['RefreshToken(refresh_token)', 'Decodes and verifies the token: signature, expiry, token_type == "refresh", and that it is not already blacklisted. Raises TokenError otherwise.'],
        ['token.blacklist()', 'Ensures an OutstandingToken row exists for its jti, then creates a BlacklistedToken row pointing to it.'],
        ['HTTP_205_RESET_CONTENT', 'Signals the client to reset its state, i.e. discard the tokens.'],
        ['except Exception', 'Any failure becomes 400 "Invalid or already blacklisted refresh token".'],
      ]} />
      <LogoutFlowDiagram />
      <Code lang="http" file="Request">{`
POST /api/logout/ HTTP/1.1
Authorization: Bearer <access_token>
Content-Type: application/json

{"refresh": "<refresh_token>"}
`}</Code>
      <Code lang="json" file="205 Reset Content">{`
{
  "message": "Logout successful"
}
`}</Code>
      <Callout type="note" title="About the 205 body">
        HTTP defines 205 as a response without content, so some HTTP clients hide the body. The status code is the reliable
        signal. If you need clients to always see the message, return <code>200 OK</code> instead.
      </Callout>

      <H2>Token blacklisting</H2>
      <p>The <code>rest_framework_simplejwt.token_blacklist</code> app provides two models, visible in the Django admin:</p>
      <Table head={['Model / table', 'Row created when', 'Key columns']} rows={[
        [<><code>OutstandingToken</code><br /><code>token_blacklist_outstandingtoken</code></>, 'A refresh token is issued at login (or first blacklisted)', 'jti, token, user, created_at, expires_at'],
        [<><code>BlacklistedToken</code><br /><code>token_blacklist_blacklistedtoken</code></>, 'A refresh token is blacklisted at logout', 'token (one-to-one to OutstandingToken), blacklisted_at'],
      ]} />
      <p>
        Once the blacklist app is in <code>INSTALLED_APPS</code>, every time Simple JWT verifies a <code>RefreshToken</code>, including
        inside <code>TokenRefreshView</code>, it checks whether the token’s <code>jti</code> is blacklisted. A blacklisted refresh token is
        therefore rejected everywhere:
      </p>
      <Code lang="json" file="POST /api/token/refresh/ with a blacklisted token · 401">{`
{
  "detail": "Token is blacklisted",
  "code": "token_not_valid"
}
`}</Code>

      <H2>What blacklisting does not do</H2>
      <ul>
        <li><strong>It does not revoke access tokens.</strong> An access token issued before logout keeps working until its 30 minutes are up. Clients must delete it.</li>
        <li><strong>It does not check ownership.</strong> The view blacklists whatever valid refresh token it receives, even one belonging to another user. That cannot happen by accident, but you may want to compare <code>token['user_id']</code> with <code>request.user.id</code>.</li>
        <li><strong>It does not clean up.</strong> Expired rows accumulate. Simple JWT ships a management command for that: <code>python manage.py flushexpiredtokens</code>.</li>
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ */
function RefreshAndProtection() {
  return (
    <>
      <H2>Refresh token workflow</H2>
      <EndpointBar method="POST" path="/api/token/refresh/" auth={false} />
      <p>
        <code>TokenRefreshView</code> accepts a refresh token and returns a fresh access token. Like the login view, it has no
        authentication or permission classes: the refresh token in the body is the credential.
      </p>
      <Code lang="json" file="Request · application/json">{`
{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIs..."
}
`}</Code>
      <Code lang="json" file="200 OK">{`
{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwi..."
}
`}</Code>
      <p>The view verifies the refresh token, checks the blacklist, confirms the user still exists and is active, and issues a new access token.</p>
      <RefreshFlowDiagram />

      <H3>Access and refresh token lifecycle</H3>
      <TokenLifecycleDiagram />
      <ul>
        <li>A login at 09:00 yields an access token valid until 09:30 and a refresh token valid until 09:00 the next day.</li>
        <li>Each refresh yields a new 30-minute access token. The refresh token itself is not renewed (no rotation).</li>
        <li>After 24 hours the refresh token expires and the user must log in again, however active they were.</li>
      </ul>
      <Callout type="future" title="Refresh token rotation">
        Setting <code>ROTATE_REFRESH_TOKENS = True</code> together with <code>BLACKLIST_AFTER_ROTATION = True</code> makes every refresh
        return a new refresh token and blacklist the old one. A stolen refresh token then becomes useless as soon as the
        legitimate client refreshes. This is not enabled in the current project.
      </Callout>

      <H2>Protected endpoints</H2>
      <p>
        Every endpoint except register, login and refresh requires a valid access token, because of the global
        <code> IsAuthenticated</code> default and the explicit <code>@permission_classes([IsAuthenticated])</code> on each view.
      </p>
      <H3>Sending the token</H3>
      <Code lang="http">{`
Authorization: Bearer <access_token>
`}</Code>
      <p>The header value must be exactly the word <code>Bearer</code>, one space, and the token. In Thunder Client, use the Auth → Bearer tab, which builds the header for you.</p>
      <H3>What happens with a bad header</H3>
      <Table head={['Header sent', 'Status', 'Response detail']} rows={[
        ['(none)', '401', <code>Authentication credentials were not provided.</code>],
        [<><code>Authorization: &lt;token&gt;</code> (no “Bearer”)</>, '401', <code>Authentication credentials were not provided.</code>],
        [<><code>Authorization: Bearer</code> (no token)</>, '401', <code>Authorization header must contain two space-delimited values</code>],
        [<code>Bearer &lt;expired access&gt;</code>, '401', <>token_not_valid · <code>Token is expired</code></>],
        [<code>Bearer &lt;refresh token&gt;</code>, '401', <>token_not_valid · <code>Token has wrong type</code></>],
        [<code>Bearer &lt;garbage&gt;</code>, '401', <>token_not_valid · <code>Token is invalid</code></>],
      ]} />
      <p>
        A header without the <code>Bearer</code> prefix is not treated as an error by <code>JWTAuthentication</code>; it is simply
        ignored. The request continues as anonymous and fails the permission check. That is why the message talks about
        missing credentials. See <L to="troubleshooting/common-problems" s="missing-bearer-token">Missing Bearer token</L>.
      </p>
      <H3>Using the authenticated user</H3>
      <p>
        Inside a protected view, <code>request.user</code> is the <code>User</code> instance loaded from the token’s <code>user_id</code>.
        The current views don’t use it yet. It is the starting point for ownership rules, for example
        <code> Product.objects.filter(owner=request.user)</code>.
      </p>
    </>
  );
}

export default [
  { slug: 'jwt/concepts', group: GROUP, title: 'JWT Concepts', nav: 'Authentication & JWT concepts', Body: Concepts,
    lede: 'What authentication means for an API, how a JSON Web Token is built, and how access and refresh tokens divide the work.' },
  { slug: 'jwt/simple-jwt-setup', group: GROUP, title: 'Simple JWT Setup and Token Generation', nav: 'Simple JWT setup', Body: SimpleJwtSetup,
    lede: 'Installing Simple JWT, the authentication settings in this project, and how tokens are generated.' },
  { slug: 'jwt/register-and-login', group: GROUP, title: 'Registration and Login', nav: 'Registration & login', Body: RegisterAndLogin,
    lede: 'Creating accounts with a function-based view and obtaining tokens from the customised /api/login/ endpoint.' },
  { slug: 'jwt/logout-and-blacklisting', group: GROUP, title: 'Logout and Token Blacklisting', nav: 'Logout & blacklisting', Body: LogoutAndBlacklisting,
    lede: 'How the logout view revokes a refresh token, and what the blacklist does and does not protect against.' },
  { slug: 'jwt/refresh-and-protected-endpoints', group: GROUP, title: 'Refresh Workflow and Protected Endpoints', nav: 'Refresh & protected endpoints', Body: RefreshAndProtection,
    lede: 'Keeping a session alive with the refresh token, and how protected endpoints read and reject tokens.' },
];
