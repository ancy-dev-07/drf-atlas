import { Callout, Code, H2, L } from '../../components/docs.jsx';

const GROUP = 'Troubleshooting';

/**
 * A consistent problem → causes → fix block. Sub-headings are plain h4s so
 * they do not repeat in the table of contents for every problem.
 */
function P(props) {
  const base = props.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return (
    <>
      <H2 id={base}>{props.title}</H2>
      {props.children}
      {props.response && <Code lang={props.lang || 'json'} file={props.file || 'Typical response'} code={props.response} />}
      <h4>Likely causes</h4>
      <ul>{props.causes.map((c, i) => <li key={i}>{c}</li>)}</ul>
      <h4>How to fix</h4>
      <ul>{props.fixes.map((f, i) => <li key={i}>{f}</li>)}</ul>
    </>
  );
}

/* ------------------------------------------------------------------ */
function HttpErrors() {
  return (
    <>
      <p>
        Start with the status code: it tells you which stage of the <L to="core-concepts/django-vs-drf" s="request-and-response-lifecycle">request lifecycle</L> rejected the
        request. Then read the body; DRF almost always says exactly what is wrong.
      </p>

      <P title="400 Bad Request"
        file="400 · serializer validation"
        response={`{
  "price": [
    "Ensure that there are no more than 2 decimal places."
  ],
  "image": [
    "No file was submitted."
  ]
}`}
        causes={[
          <>A field failed serializer validation: missing, too long, wrong type, or rejected by <code>validate_image</code>. Each key in the body names a failing field.</>,
          <>Malformed JSON, e.g. single quotes or a trailing comma: <code>{'{"detail": "JSON parse error - Expecting property name enclosed in double quotes: …"}'}</code>.</>,
          <>Logout: missing <code>refresh</code> key (<code>"Refresh token is required"</code>) or an invalid/blacklisted token (<code>"Invalid or already blacklisted refresh token"</code>).</>,
          <>Login: <code>username</code> or <code>password</code> missing.</>,
          <>A manual <code>Content-Type: multipart/form-data</code> header without a boundary: <code>"Multipart form parse error - Invalid boundary in multipart: None"</code>.</>,
        ]}
        fixes={[
          'Read the field names in the response and correct exactly those fields.',
          'Validate your JSON (double quotes, no trailing commas).',
          'For PUT, send all four fields including the image; use PATCH to change only some.',
          'Remove manually added Content-Type headers for multipart requests.',
        ]}
      />

      <P title="401 Unauthorized"
        file="401 · no token"
        response={`{
  "detail": "Authentication credentials were not provided."
}`}
        causes={[
          'No Authorization header on a protected endpoint, or a header without the “Bearer ” prefix.',
          <>Expired, tampered or wrong-type token: <code>"code": "token_not_valid"</code> with a <code>messages</code> list explaining why.</>,
          <>Wrong username or password at <code>/api/login/</code>: <code>"No active account found with the given credentials"</code>.</>,
          <>Refresh token expired or blacklisted at <code>/api/token/refresh/</code>.</>,
          <>An invalid Bearer header sent to <code>/api/register/</code>: authentication still runs there even though the permission is <code>AllowAny</code>.</>,
        ]}
        fixes={[
          'Log in again (or refresh) and use the new access token with Auth → Bearer.',
          <>Read <code>messages[0].message</code>: “Token is expired”, “Token is invalid”, or “Token has wrong type” each point to a specific mistake.</>,
          'Remove the Authorization header from register, login and refresh requests.',
        ]}
      />

      <P title="403 Forbidden"
        causes={[
          <>This project does not normally return 403. <code>JWTAuthentication</code> provides a <code>WWW-Authenticate</code> header, so DRF reports unauthenticated requests as 401.</>,
          'You would see 403 if an authenticated user fails a permission check, for example after adding IsAdminUser or an ownership permission.',
          'A 403 HTML page mentioning CSRF means the request did not reach a DRF view (for example the Django admin login form) or SessionAuthentication was added.',
        ]}
        fixes={[
          'Confirm the URL is one of the API endpoints, with a trailing slash.',
          'If you added permission classes, check the user meets them (e.g. is_staff for IsAdminUser).',
        ]}
      >
        <p>403 means the server knows who you are but refuses the action. 401 means it does not know who you are.</p>
      </P>

      <P title="404 Not Found"
        file="404 · DRF view"
        response={`{
  "detail": "No Product matches the given query."
}`}
        causes={[
          <>JSON 404: the product id does not exist (never created, or already deleted). Raised by <code>get_object_or_404</code>.</>,
          <>HTML 404 page (“Page not found”): the URL matched no pattern, e.g. <code>/api/token/</code> (login is <code>/api/login/</code>), a missing <code>/api/</code> prefix, a typo, or a non-numeric id like <code>/api/products/abc/</code>.</>,
          <><code>/media/…</code> 404: <code>DEBUG</code> is False, or the file is not in <code>backend/media/</code>.</>,
        ]}
        fixes={[
          <>List products with <code>GET /api/products/</code> to find valid ids.</>,
          <>Compare the URL with the <L to="api/overview">endpoint table</L>, character for character.</>,
          'With DEBUG on, Django’s 404 page lists every URL pattern it tried, which helps spot typos.',
        ]}
      />

      <P title="415 Unsupported Media Type"
        response={`{
  "detail": "Unsupported media type \\"application/json\\" in request."
}`}
        causes={[
          <>A JSON body sent to <code>/api/products/create/</code> or <code>/api/products/{'{id}'}/update/</code>. Those views only accept <code>multipart/form-data</code> and <code>application/x-www-form-urlencoded</code>.</>,
          'A raw text, XML or binary body sent to any endpoint.',
        ]}
        fixes={[
          'In Thunder Client: Body → Form. In curl: -F instead of -d. In JavaScript: a FormData body.',
          'For a text-only change, PATCH with Form fields still works without an image.',
        ]}
      />

      <H2>Other codes you may meet</H2>
      <ul>
        <li><strong>405 Method Not Allowed:</strong> wrong method for the URL, e.g. <code>GET /api/products/create/</code> → <code>{'{"detail": "Method \\"GET\\" not allowed."}'}</code>. Note that a missing token is reported first, as 401.</li>
        <li><strong>500 Internal Server Error:</strong> an unhandled exception. Look at the traceback in the <code>runserver</code> terminal. A known case is registering without an <code>email</code> field.</li>
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ */
function CommonProblems() {
  return (
    <>
      <P title="Invalid credentials"
        file="POST /api/login/ · 401"
        response={`{
  "detail": "No active account found with the given credentials"
}`}
        causes={[
          'Wrong username or password. Both are case-sensitive.',
          'The user was never registered in this database (for example after deleting db.sqlite3).',
          'The user is inactive (is_active = False in the admin).',
          'Login was attempted at /api/token/, which returns 404, not 401.',
        ]}
        fixes={[
          'Register again, or create a user with python manage.py createsuperuser.',
          'Check the user in /admin/ → Users.',
        ]}
      />

      <P title="Expired access token"
        file="Any protected endpoint · 401"
        response={`{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is expired"
    }
  ]
}`}
        causes={['More than 30 minutes (ACCESS_TOKEN_LIFETIME) have passed since the access token was issued.']}
        fixes={[
          <>POST the refresh token to <code>/api/token/refresh/</code> and use the returned <code>access</code>.</>,
          'If the refresh token is also expired (after 1 day) or blacklisted, log in again.',
        ]}
      />

      <P title="Invalid refresh token"
        file="POST /api/token/refresh/ · 401"
        response={`{
  "detail": "Token is blacklisted",
  "code": "token_not_valid"
}`}
        causes={[
          <><code>"Token is blacklisted"</code>: you already logged out with this refresh token.</>,
          <><code>"Token is expired"</code>: more than one day since login.</>,
          <><code>"Token has wrong type"</code>: you sent the access token instead of the refresh token.</>,
          <><code>"Token is invalid"</code>: truncated when copying, extra quotes, or signed with a different SECRET_KEY.</>,
          <>At <code>/api/logout/</code>, all of these appear as 400 <code>"Invalid or already blacklisted refresh token"</code>.</>,
        ]}
        fixes={[
          'Copy the refresh value without surrounding quotes.',
          'Log in again to get a fresh pair.',
        ]}
      />

      <P title="Missing Bearer token"
        file="401"
        response={`{
  "detail": "Authentication credentials were not provided."
}`}
        causes={[
          'Auth tab set to “No Auth” or “inherit” with nothing to inherit.',
          <>Header written as <code>Authorization: eyJ…</code> without <code>Bearer</code>. JWTAuthentication ignores headers that don’t start with Bearer.</>,
          <>Header written as <code>Authorization: Bearer</code> with no token gives a different message: <code>"Authorization header must contain two space-delimited values"</code>.</>,
          <>Using <code>JWT eyJ…</code> or <code>Token eyJ…</code>: only <code>Bearer</code> is accepted (AUTH_HEADER_TYPES).</>,
        ]}
        fixes={['Use Auth → Bearer and paste only the token, or set the header to exactly: Bearer <token>.']}
      />

      <P title="Multipart upload problems"
        causes={[
          'Body tab set to JSON → 415.',
          <>File added as a text field, or key not exactly <code>image</code> → <code>{'"image": ["No file was submitted."]'}</code>.</>,
          'A manual Content-Type header without a boundary → 400 “Multipart form parse error”.',
          'A selected file that was moved or deleted on disk, so Thunder Client sends an empty part → “The submitted file is empty.”',
          'Text field names misspelled (e.g. Price) → “This field is required.” for the real field.',
        ]}
        fixes={[
          'Body → Form, Files enabled, image as file type, other fields as text.',
          'Delete any manual Content-Type header.',
          'Field names are lower-case: name, description, price, image.',
        ]}
      >
        <p>Uploads have more moving parts than JSON requests. Check these in order:</p>
      </P>

      <P title="Image validation errors"
        file="400"
        response={`{
  "image": [
    "Upload a valid image. The file you uploaded was either not an image or a corrupted image."
  ]
}`}
        causes={[
          <><code>Upload a valid image…</code>: Pillow cannot read the file (not an image, corrupted, or e.g. an SVG, which is XML rather than a raster image).</>,
          <><code>Image size should not exceed 2 MB</code>: file over 2,097,152 bytes.</>,
          <><code>Only JPG, JPEG and PNG images are allowed</code>: valid image with another extension (.gif, .webp, .bmp, .heic).</>,
          <><code>The submitted file is empty.</code>: zero-byte file.</>,
        ]}
        fixes={[
          'Export or convert the image to PNG or JPEG.',
          'Resize or compress large photos below 2 MB.',
        ]}
      />

      <P title="Migration errors" lang="text"
        file="Typical errors"
        response={`django.db.utils.OperationalError: no such table: products_product
django.db.utils.OperationalError: no such table: token_blacklist_outstandingtoken`}
        causes={[
          <><code>no such table: products_product</code>: migrations not applied, or a new empty <code>db.sqlite3</code>.</>,
          <><code>no such table: token_blacklist_outstandingtoken</code> (500 at login): the blacklist app was added to INSTALLED_APPS but <code>migrate</code> was not run. Login writes an OutstandingToken row, so it fails.</>,
          <>“It is impossible to add a non-nullable field … without specifying a default”: you added a required field to Product while rows exist.</>,
          <>“No changes detected”: the app is missing from INSTALLED_APPS, or you saved models.py in a different project copy.</>,
        ]}
        fixes={[
          <>Run <code>python manage.py migrate</code> from <code>backend/</code>.</>,
          'For a new required field, choose option 1 and provide a one-off default, or give the field default=… / null=True in models.py.',
          'During early development only, you can delete db.sqlite3 and run migrate again (all data is lost).',
        ]}
      />

      <P title="Commands fail from the repository root" lang="text"
        response={`ModuleNotFoundError: No module named 'backend.settings'`}
        causes={['The root-level manage.py points to backend.settings, which does not exist. The real settings module is config.settings.']}
        fixes={[<>Run commands from <code>backend/</code>: <code>cd backend</code> then <code>python manage.py …</code>. The root file can be deleted.</>]}
      />

      <P title="Server error when registering" lang="text"
        file="runserver terminal"
        response={`Internal Server Error: /api/register/
KeyError: 'email'`}
        causes={[<>The request had no <code>email</code> key. The serializer allows that, but <code>create()</code> reads <code>validated_data['email']</code>.</>]}
        fixes={[
          'Always include "email" in the registration body.',
          <>Permanent fix: <L to="best-practices/improvements" s="known-limitations-of-the-current-code">Known limitations</L>.</>,
        ]}
      />
      <Callout type="tip" title="Read the terminal">
        For any 500 error, the <code>runserver</code> terminal prints the full Python traceback. The last line names the exception;
        the lines above it show which file and line raised it.
      </Callout>
    </>
  );
}

export default [
  { slug: 'troubleshooting/http-errors', group: GROUP, title: 'HTTP Errors', nav: '400 · 401 · 403 · 404 · 415', Body: HttpErrors,
    lede: 'What each error status means in this API, what causes it, and how to fix it.' },
  { slug: 'troubleshooting/common-problems', group: GROUP, title: 'Common Problems', Body: CommonProblems,
    lede: 'Specific failures you are likely to hit while building and testing: tokens, uploads, validation, and migrations.' },
];
