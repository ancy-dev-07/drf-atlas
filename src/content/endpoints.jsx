/**
 * Endpoint definitions for the API Reference. Response bodies match what the
 * views in products/views.py and Simple JWT 5.5 actually return.
 */
import { L } from '../components/docs.jsx';

export const SAMPLE_PRODUCT = `{
  "id": 1,
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4 GHz wireless mouse",
  "price": "25.99",
  "image": "/media/products/mouse.png",
  "created_at": "2026-11-21T14:40:12.481203Z"
}`;

const indent = (s, n) => s.split('\n').map((l, i) => (i === 0 ? l : ' '.repeat(n) + l)).join('\n');

const ERR = {
  noToken: { status: 401, when: 'No Authorization header, or the header does not start with Bearer', body: `{
  "detail": "Authentication credentials were not provided."
}` },
  badToken: { status: 401, when: 'Access token expired, malformed, or signed with another key', body: `{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid",
  "messages": [
    {
      "token_class": "AccessToken",
      "token_type": "access",
      "message": "Token is expired"
    }
  ]
}` },
  notFound: { status: 404, when: 'No product with this id exists', body: `{
  "detail": "No Product matches the given query."
}` },
  unsupported: { status: 415, when: 'Body sent as JSON (or raw) instead of multipart/form-data', body: `{
  "detail": "Unsupported media type \\"application/json\\" in request."
}` },
};

const BEARER = ['Authorization', 'Bearer <access_token>', 'Yes'];

export const endpoints = [
  {
    slug: 'api/register',
    title: 'Register user',
    method: 'POST',
    path: '/api/register/',
    auth: false,
    view: 'register',
    kind: 'json',
    summary: 'Creates a new Django user account. This is the only product-app view that is open to anonymous users.',
    headers: [['Content-Type', 'application/json', 'Yes']],
    fields: [
      ['username', 'string', 'Yes', 'Must be unique. Letters, digits and @ . + - _ only (Django username rules).'],
      ['email', 'string', 'Send it', 'Must be a valid email address. See the warning below about omitting it.'],
      ['password', 'string', 'Yes', 'Write-only: hashed with create_user() and never returned.'],
    ],
    request: `{
  "username": "atlas_dev",
  "email": "dev@example.com",
  "password": "StrongPass#2026"
}`,
    success: { status: 201, text: 'Created', body: `{
  "message": "User registered successfully",
  "user": {
    "id": 1,
    "username": "atlas_dev",
    "email": "dev@example.com"
  }
}` },
    errors: [
      { status: 400, when: 'Username already taken', body: `{
  "username": [
    "A user with that username already exists."
  ]
}` },
      { status: 400, when: 'Required field missing', body: `{
  "password": [
    "This field is required."
  ]
}` },
      { status: 400, when: 'Malformed email', body: `{
  "email": [
    "Enter a valid email address."
  ]
}` },
    ],
    explain: (
      <>
        <p>
          The view passes <code>request.data</code> to <code>RegisterSerializer</code>. When validation succeeds,
          <code> serializer.save()</code> calls the serializer’s custom <code>create()</code>, which uses
          <code> User.objects.create_user()</code> so the password is stored as a salted hash rather than plain text.
          Because <code>password</code> is declared <code>write_only=True</code>, it is excluded from <code>serializer.data</code>.
        </p>
        <p>
          <code>@permission_classes([AllowAny])</code> overrides the project-wide <code>IsAuthenticated</code> default.
          Registration does <strong>not</strong> return tokens: call <L to="api/login">Login</L> afterwards.
        </p>
      </>
    ),
    warning: (
      <>
        Always send <code>email</code>. Django’s <code>User.email</code> is optional, so the serializer accepts a request
        without it, but <code>create()</code> reads <code>validated_data['email']</code>, which raises a <code>KeyError</code> and
        returns <strong>500 Internal Server Error</strong>. See <L to="best-practices/improvements" s="known-limitations-of-the-current-code">Known limitations</L>.
      </>
    ),
  },
  {
    slug: 'api/login',
    title: 'Login (obtain tokens)',
    nav: 'Login',
    method: 'POST',
    path: '/api/login/',
    auth: false,
    view: 'TokenObtainPairView (Simple JWT)',
    kind: 'json',
    summary: 'Validates a username and password and returns a refresh/access token pair. This project mounts Simple JWT’s TokenObtainPairView at /api/login/ instead of the default /api/token/.',
    headers: [['Content-Type', 'application/json', 'Yes']],
    fields: [
      ['username', 'string', 'Yes', 'The registered username.'],
      ['password', 'string', 'Yes', 'The plain-text password; compared against the stored hash.'],
    ],
    request: `{
  "username": "atlas_dev",
  "password": "StrongPass#2026"
}`,
    success: { status: 200, text: 'OK', body: `{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIs...",
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwi..."
}` },
    errors: [
      { status: 401, when: 'Wrong username or password, or inactive user', body: `{
  "detail": "No active account found with the given credentials"
}` },
      { status: 400, when: 'Field missing', body: `{
  "username": [
    "This field is required."
  ],
  "password": [
    "This field is required."
  ]
}` },
    ],
    explain: (
      <>
        <p>
          <code>TokenObtainPairView</code> sets <code>authentication_classes = ()</code> and <code>permission_classes = ()</code>, so it
          ignores the global <code>IsAuthenticated</code> default and any <code>Authorization</code> header you send. It calls Django’s
          <code> authenticate()</code>; on success it creates a <code>RefreshToken</code> for the user and derives the access token from it.
        </p>
        <p>
          With <code>SIMPLE_JWT</code> in <code>settings.py</code>, the access token lives <strong>30 minutes</strong> and the refresh token
          <strong> 1 day</strong>. Because the <code>token_blacklist</code> app is installed, the refresh token is also recorded as an
          <code> OutstandingToken</code> row so it can be blacklisted at logout.
        </p>
      </>
    ),
    warning: <>The login URL is <code>/api/login/</code>. There is no <code>/api/token/</code> route in this project; requesting it returns 404.</>,
  },
  {
    slug: 'api/token-refresh',
    title: 'Refresh access token',
    nav: 'Refresh token',
    method: 'POST',
    path: '/api/token/refresh/',
    auth: false,
    view: 'TokenRefreshView (Simple JWT)',
    kind: 'json',
    summary: 'Exchanges a valid refresh token for a new access token.',
    headers: [['Content-Type', 'application/json', 'Yes']],
    fields: [['refresh', 'string', 'Yes', 'The refresh token returned by /api/login/.']],
    request: `{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIs..."
}`,
    success: { status: 200, text: 'OK', body: `{
  "access": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwi..."
}` },
    errors: [
      { status: 401, when: 'Refresh token was blacklisted by /api/logout/', body: `{
  "detail": "Token is blacklisted",
  "code": "token_not_valid"
}` },
      { status: 401, when: 'Refresh token older than 1 day', body: `{
  "detail": "Token is expired",
  "code": "token_not_valid"
}` },
      { status: 401, when: 'Garbage or tampered token', body: `{
  "detail": "Token is invalid",
  "code": "token_not_valid"
}` },
      { status: 401, when: 'An access token was sent instead of a refresh token', body: `{
  "detail": "Token has wrong type",
  "code": "token_not_valid"
}` },
    ],
    explain: (
      <>
        <p>
          Only <code>access</code> is returned. <code>ROTATE_REFRESH_TOKENS</code> is not set in <code>SIMPLE_JWT</code> (Simple JWT
          defaults it to <code>False</code>), so the client keeps using the <em>same</em> refresh token until it expires one day after
          login or is blacklisted.
        </p>
        <p>
          Like the login view, this view has no authentication or permission classes. Do not send the expired access token in
          an <code>Authorization</code> header: it is not needed and is ignored.
        </p>
      </>
    ),
  },
  {
    slug: 'api/logout',
    title: 'Logout',
    method: 'POST',
    path: '/api/logout/',
    auth: true,
    view: 'logout',
    kind: 'json',
    summary: 'Blacklists the supplied refresh token so it can no longer be used to obtain access tokens.',
    headers: [BEARER, ['Content-Type', 'application/json', 'Yes']],
    fields: [['refresh', 'string', 'Yes', 'The refresh token to revoke.']],
    request: `{
  "refresh": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoicmVmcmVzaCIs..."
}`,
    success: { status: 205, text: 'Reset Content', body: `{
  "message": "Logout successful"
}` },
    errors: [
      { status: 400, when: 'No "refresh" key in the body', body: `{
  "error": "Refresh token is required"
}` },
      { status: 400, when: 'Token is invalid, expired, or already blacklisted', body: `{
  "error": "Invalid or already blacklisted refresh token"
}` },
      ERR.noToken,
      ERR.badToken,
    ],
    explain: (
      <>
        <p>
          The request needs <strong>two</strong> tokens: the access token in the <code>Authorization</code> header (to pass
          <code> IsAuthenticated</code>) and the refresh token in the JSON body (the token being revoked).
          <code> RefreshToken(refresh_token)</code> verifies the token, then <code>token.blacklist()</code> creates a
          <code> BlacklistedToken</code> row. Any exception in that block is reported as the same generic 400 message.
        </p>
        <p>
          Logout does not invalidate the current access token. It remains valid until its 30-minute lifetime ends; the client
          should discard it immediately.
        </p>
      </>
    ),
    warning: (
      <>
        The view returns <strong>205 Reset Content</strong> with a JSON body. HTTP says a 205 response should not carry content,
        so some clients hide the body. The status code alone tells you logout succeeded.
      </>
    ),
  },
  {
    slug: 'api/products-create',
    title: 'Create product',
    method: 'POST',
    path: '/api/products/create/',
    auth: true,
    view: 'create_product',
    kind: 'multipart',
    summary: 'Creates a product, including its image, from a multipart/form-data request.',
    headers: [BEARER, ['Content-Type', 'multipart/form-data; boundary=…', 'Set automatically']],
    fields: [
      ['name', 'text', 'Yes', 'Up to 100 characters.'],
      ['description', 'text', 'Yes', 'Free text; must not be blank.'],
      ['price', 'text', 'Yes', 'Decimal, max 10 digits with 2 decimal places, e.g. 25.99.'],
      ['image', 'file', 'Yes', 'JPG, JPEG or PNG, max 2 MB, must be a real image.'],
    ],
    requestForm: `name         Wireless Mouse
description  Ergonomic 2.4 GHz wireless mouse
price        25.99
image        [file] mouse.png`,
    success: { status: 201, text: 'Created', body: `{
  "message": "Product created successfully",
  "data": ${indent(SAMPLE_PRODUCT, 2)}
}` },
    errors: [
      { status: 400, when: 'Fields missing (including no file selected)', body: `{
  "name": [
    "This field is required."
  ],
  "image": [
    "No file was submitted."
  ]
}` },
      { status: 400, when: 'Image larger than 2 MB', body: `{
  "image": [
    "Image size should not exceed 2 MB"
  ]
}` },
      { status: 400, when: 'Valid image with a disallowed extension (e.g. .gif, .webp)', body: `{
  "image": [
    "Only JPG, JPEG and PNG images are allowed"
  ]
}` },
      { status: 400, when: 'File is not an image or is corrupted', body: `{
  "image": [
    "Upload a valid image. The file you uploaded was either not an image or a corrupted image."
  ]
}` },
      { status: 400, when: 'Price not a valid decimal', body: `{
  "price": [
    "A valid number is required."
  ]
}` },
      ERR.unsupported,
      ERR.noToken,
    ],
    explain: (
      <>
        <p>
          <code>@parser_classes([MultiPartParser, FormParser])</code> restricts this view to form encodings, so
          <code> request.data</code> contains the text fields and the uploaded file. <code>ProductSerializer</code> validates all four
          fields; <code>id</code> and <code>created_at</code> are read-only and set by Django. The file is written to
          <code> media/products/</code> only when <code>serializer.save()</code> runs.
        </p>
        <p>
          <code>image</code> in the response is a path relative to the server (<code>/media/…</code>) because the view does not pass the
          request into the serializer context. Prefix it with <code>http://127.0.0.1:8000</code> to open it.
        </p>
      </>
    ),
  },
  {
    slug: 'api/products-list',
    title: 'List products',
    method: 'GET',
    path: '/api/products/',
    auth: true,
    view: 'get_products',
    kind: 'none',
    summary: 'Returns every product in the database.',
    headers: [BEARER],
    fields: [],
    success: { status: 200, text: 'OK', body: `{
  "message": "Products retrieved successfully",
  "data": [
    ${indent(SAMPLE_PRODUCT, 4)},
    {
      "id": 2,
      "name": "Mechanical Keyboard",
      "description": "Tenkeyless, brown switches",
      "price": "79.00",
      "image": "/media/products/keyboard.png",
      "created_at": "2026-11-21T15:02:44.120938Z"
    }
  ]
}` },
    errors: [ERR.noToken, ERR.badToken],
    explain: (
      <>
        <p>
          <code>Product.objects.all()</code> fetches every row and <code>ProductSerializer(products, many=True)</code> turns the queryset
          into a list. With no products, <code>data</code> is an empty list <code>[]</code> and the status is still 200.
        </p>
        <p>
          The model defines no <code>Meta.ordering</code>, so the database decides the order (in practice, insertion order on SQLite).
          There is no pagination, filtering or search yet; see <L to="best-practices/improvements">Improvements</L>.
        </p>
      </>
    ),
  },
  {
    slug: 'api/products-retrieve',
    title: 'Retrieve product',
    method: 'GET',
    path: '/api/products/{id}/',
    auth: true,
    view: 'get_product',
    kind: 'none',
    summary: 'Returns one product by its integer primary key.',
    headers: [BEARER],
    fields: [],
    params: [['id', 'integer', 'Product primary key. The <int:pk> converter rejects non-digits with a Django 404 page before the view runs.']],
    success: { status: 200, text: 'OK', body: `{
  "message": "Product retrieved successfully",
  "data": ${indent(SAMPLE_PRODUCT, 2)}
}` },
    errors: [ERR.notFound, ERR.noToken, ERR.badToken],
    explain: (
      <p>
        <code>get_object_or_404(Product, id=pk)</code> either returns the product or raises Django’s <code>Http404</code>; DRF’s exception
        handler converts that into a JSON 404 response. The single object is serialized without <code>many=True</code>, so
        <code> data</code> is an object rather than a list.
      </p>
    ),
  },
  {
    slug: 'api/products-update-put',
    title: 'Update product (PUT)',
    nav: 'Update (PUT)',
    method: 'PUT',
    path: '/api/products/{id}/update/',
    auth: true,
    view: 'update_product',
    kind: 'multipart',
    summary: 'Replaces a product. Every writable field, including a new image file, must be sent.',
    headers: [BEARER, ['Content-Type', 'multipart/form-data; boundary=…', 'Set automatically']],
    params: [['id', 'integer', 'Product primary key.']],
    fields: [
      ['name', 'text', 'Yes', 'Up to 100 characters.'],
      ['description', 'text', 'Yes', 'Free text.'],
      ['price', 'text', 'Yes', 'Decimal, e.g. 29.99.'],
      ['image', 'file', 'Yes', 'A new JPG/JPEG/PNG ≤ 2 MB. Required with PUT even if unchanged.'],
    ],
    requestForm: `name         Wireless Mouse Pro
description  Silent clicks, USB-C charging
price        29.99
image        [file] mouse-pro.png`,
    success: { status: 200, text: 'OK', body: `{
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "name": "Wireless Mouse Pro",
    "description": "Silent clicks, USB-C charging",
    "price": "29.99",
    "image": "/media/products/mouse-pro.png",
    "created_at": "2026-11-21T14:40:12.481203Z"
  }
}` },
    errors: [
      { status: 400, when: 'Any field missing, typically the image', body: `{
  "image": [
    "No file was submitted."
  ]
}` },
      ERR.notFound, ERR.unsupported, ERR.noToken,
    ],
    explain: (
      <>
        <p>
          <code>partial = request.method == 'PATCH'</code> evaluates to <code>False</code> for PUT, so the serializer requires every field
          that is required on create. <code>created_at</code> and <code>id</code> never change.
        </p>
        <p>
          The previous image file is <strong>not deleted</strong> from <code>media/products/</code>; only the database reference changes.
          See <L to="image-upload/validation-and-replacement" s="replacing-existing-images">Replacing existing images</L>.
        </p>
      </>
    ),
  },
  {
    slug: 'api/products-update-patch',
    title: 'Update product (PATCH)',
    nav: 'Update (PATCH)',
    method: 'PATCH',
    path: '/api/products/{id}/update/',
    auth: true,
    view: 'update_product',
    kind: 'multipart',
    summary: 'Updates only the fields you send. Other fields keep their current values.',
    headers: [BEARER, ['Content-Type', 'multipart/form-data; boundary=…', 'Set automatically']],
    params: [['id', 'integer', 'Product primary key.']],
    fields: [
      ['name', 'text', 'No', 'Send only if changing.'],
      ['description', 'text', 'No', 'Send only if changing.'],
      ['price', 'text', 'No', 'Send only if changing.'],
      ['image', 'file', 'No', 'Send only to replace the image; validated like on create.'],
    ],
    requestForm: `price        19.99`,
    success: { status: 200, text: 'OK', body: `{
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "name": "Wireless Mouse",
    "description": "Ergonomic 2.4 GHz wireless mouse",
    "price": "19.99",
    "image": "/media/products/mouse.png",
    "created_at": "2026-11-21T14:40:12.481203Z"
  }
}` },
    errors: [
      { status: 400, when: 'A sent field is invalid', body: `{
  "price": [
    "A valid number is required."
  ]
}` },
      ERR.notFound, ERR.unsupported, ERR.noToken,
    ],
    explain: (
      <>
        <p>
          For PATCH, <code>partial=True</code> tells the serializer to skip “required” checks for fields that are absent. Validation
          still runs on every field that <em>is</em> present, including <code>validate_image()</code> when a new file is sent.
        </p>
        <p>
          Even a text-only PATCH must use <strong>Form</strong> (multipart) or form-urlencoded in Thunder Client: the view’s parsers do not
          accept JSON.
        </p>
      </>
    ),
  },
  {
    slug: 'api/products-delete',
    title: 'Delete product',
    method: 'DELETE',
    path: '/api/products/{id}/delete/',
    auth: true,
    view: 'delete_product',
    kind: 'none',
    summary: 'Deletes a product permanently.',
    headers: [BEARER],
    params: [['id', 'integer', 'Product primary key.']],
    fields: [],
    success: { status: 200, text: 'OK', body: `{
  "message": "Product deleted successfully"
}` },
    errors: [ERR.notFound, ERR.noToken, ERR.badToken],
    explain: (
      <>
        <p>
          The view looks the product up with <code>get_object_or_404</code> and calls <code>product.delete()</code>. It returns
          <strong> 200 OK</strong> with a confirmation message rather than an empty <code>204 No Content</code>, so clients can show the
          message directly. Deleting the same id a second time returns 404.
        </p>
        <p>The image file stays on disk in <code>media/products/</code>; only the database row is removed.</p>
      </>
    ),
  },
];
