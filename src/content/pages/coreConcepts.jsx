import { Callout, Code, Compare, H2, H3, L, Method, Table, Status } from '../../components/docs.jsx';
import { DjangoVsDrfDiagram, RequestLifecycleDiagram } from '../../diagrams/index.jsx';
import { CODE } from '../../lib/source.js';

const GROUP = 'Core Concepts';

/* ------------------------------------------------------------------ */
function DjangoVsDrf() {
  return (
    <>
      <H2>Django vs Django REST Framework</H2>
      <p>
        <strong>Django</strong> is a complete web framework. Out of the box it routes URLs to views, talks to databases through
        its ORM, manages users and passwords, and renders HTML templates. A classic Django view receives an
        <code> HttpRequest</code> and returns an <code>HttpResponse</code>, usually HTML.
      </p>
      <p>
        <strong>Django REST Framework</strong> is a Django app (listed in <code>INSTALLED_APPS</code> as <code>'rest_framework'</code>)
        that specialises Django for APIs. It does not replace any part of Django. It wraps your views so they receive a richer
        <code> Request</code>, return a <code>Response</code> that renders to JSON, and run authentication and permission checks first.
      </p>
      <Compare
        left={{ title: 'Django provides', body: <ul><li>URL routing (<code>path()</code>, <code>include()</code>)</li><li>Models and the ORM</li><li>The <code>User</code> model and password hashing</li><li>Settings, middleware, admin</li><li>Media file storage</li></ul> }}
        right={{ title: 'DRF adds', body: <ul><li><code>@api_view</code>, <code>Request</code>, <code>Response</code></li><li>Serializers for validation and JSON</li><li>Parsers (JSON, form, multipart)</li><li>Authentication and permission classes</li><li>Consistent JSON error responses</li></ul> }}
      />
      <DjangoVsDrfDiagram />

      <H2>How DRF handles requests</H2>
      <p>
        The decorator <code>@api_view(['POST'])</code> is the entry point. Under the hood it builds a small class-based
        <code> APIView</code> around your function. Your function body becomes the handler for the listed methods, and DRF’s
        <code> APIView.dispatch()</code> runs around it. You write a plain function; DRF supplies the machinery.
      </p>
      <Code lang="python" file="backend/products/views.py" code={CODE.getProduct} mark={['@api_view', '@permission_classes']} />
      <p>When a request reaches this function, DRF has already done the following:</p>
      <ol>
        <li><strong>Wrapped the request.</strong> The Django <code>HttpRequest</code> becomes a DRF <code>Request</code> with <code>request.data</code> and <code>request.user</code>.</li>
        <li><strong>Authenticated.</strong> Each class in <code>DEFAULT_AUTHENTICATION_CLASSES</code> runs; here that is <code>JWTAuthentication</code>.</li>
        <li><strong>Checked permissions.</strong> <code>@permission_classes([IsAuthenticated])</code> requires <code>request.user</code> to be a real, logged-in user.</li>
        <li><strong>Checked the method.</strong> A method not listed in <code>@api_view</code> gets <Status code={405} /> <code>{'{"detail": "Method \\"GET\\" not allowed."}'}</code>.</li>
        <li><strong>Called your function</strong> and, afterwards, rendered the returned <code>Response</code> to JSON.</li>
      </ol>
      <p>
        If any step raises a DRF exception (or Django’s <code>Http404</code>), DRF’s exception handler converts it into a JSON error
        response. That is why <code>get_object_or_404</code> produces <code>{'{"detail": "No Product matches the given query."}'}</code>
        instead of an HTML error page.
      </p>
      <Callout type="note" title="Why no CSRF errors?">
        <code>CsrfViewMiddleware</code> is enabled in <code>settings.py</code>, yet POST requests from Thunder Client never fail
        CSRF checks. DRF marks its views as CSRF-exempt and only enforces CSRF inside <code>SessionAuthentication</code>, which this
        project does not use. JWTs sent in a header are not attached automatically by the browser, so they are not exposed to
        CSRF in the same way cookies are.
      </Callout>

      <H2>Request and response lifecycle</H2>
      <p>
        Here is the full path of an authenticated request, for example creating a product. The order matters when you
        debug: an error from an early stage hides every later one. A request with no token returns 401 even if the body is
        also invalid, because permissions are checked before the view runs.
      </p>
      <RequestLifecycleDiagram />
      <Table head={['Stage', 'Code involved', 'Typical failure']} rows={[
        ['URL resolution', <><code>config/urls.py</code> → <code>products/urls.py</code></>, '404 HTML page (unknown path)'],
        ['Authentication', <code>JWTAuthentication</code>, '401 token_not_valid'],
        ['Permissions', <><code>IsAuthenticated</code> / <code>AllowAny</code></>, '401 credentials not provided'],
        ['Method check', <code>@api_view([...])</code>, '405 Method not allowed'],
        ['Parsing', <><code>request.data</code> + parser classes</>, '415 Unsupported media type, 400 parse error'],
        ['Lookup', <code>get_object_or_404</code>, '404 No Product matches…'],
        ['Validation', <code>serializer.is_valid()</code>, '400 with field errors'],
        ['Persistence', <><code>serializer.save()</code>, <code>delete()</code></>, '500 (unexpected database error)'],
        ['Rendering', <code>Response(..., status=...)</code>, '—'],
      ]} />
      <Callout type="tip">
        Parsing is lazy. DRF reads the body the first time your code touches <code>request.data</code>, so a 415 appears only in
        views that read the body. <code>get_products</code> never reads it.
      </Callout>
    </>
  );
}

/* ------------------------------------------------------------------ */
function HttpBasics() {
  return (
    <>
      <H2>HTTP methods</H2>
      <p>
        The HTTP method tells the server what you intend to do with the resource at the URL. Two properties are worth knowing.
        A <strong>safe</strong> method does not change data. An <strong>idempotent</strong> method has the same effect whether you send
        it once or several times.
      </p>
      <Table head={['Method', 'Meaning', 'Safe', 'Idempotent', 'Used for']} rows={[
        [<Method m="GET" />, 'Read a resource', 'Yes', 'Yes', <><code>/api/products/</code>, <code>/api/products/{'{id}'}/</code></>],
        [<Method m="POST" />, 'Create something or trigger an action', 'No', 'No', 'register, login, refresh, logout, create product'],
        [<Method m="PUT" />, 'Replace a resource entirely', 'No', 'Yes', <code>/api/products/{'{id}'}/update/</code>],
        [<Method m="PATCH" />, 'Modify part of a resource', 'No', 'Not guaranteed', <code>/api/products/{'{id}'}/update/</code>],
        [<Method m="DELETE" />, 'Remove a resource', 'No', 'Yes', <code>/api/products/{'{id}'}/delete/</code>],
      ]} />
      <p>
        Idempotent describes the state on the server, not the response. Deleting product 2 twice leaves the database in the
        same state, even though the second call returns 404. The difference between PUT and PATCH is explained in
        <L to="crud/update"> Update using PUT and PATCH</L>.
      </p>

      <H2>HTTP status codes</H2>
      <p>
        Every response carries a three-digit status code. The first digit gives the class: <code>2xx</code> success,
        <code> 4xx</code> client error (fix the request), <code>5xx</code> server error (fix the code). These are the codes this API
        actually returns:
      </p>
      <Table head={['Code', 'Name', 'Returned when']} rows={[
        [<Status code={200} />, 'OK', 'Successful login, refresh, list, retrieve, update, delete'],
        [<Status code={201} />, 'Created', 'Successful register and create product'],
        [<Status code={205} />, 'Reset Content', 'Successful logout (chosen in the logout view)'],
        [<Status code={400} />, 'Bad Request', 'Serializer validation failed, or logout received a bad or missing refresh token'],
        [<Status code={401} />, 'Unauthorized', 'No token, invalid or expired token, or wrong login credentials'],
        [<Status code={404} />, 'Not Found', 'Product id does not exist, or the URL does not match any route'],
        [<Status code={405} />, 'Method Not Allowed', 'Method not listed in the view’s @api_view'],
        [<Status code={415} />, 'Unsupported Media Type', 'JSON sent to an endpoint that only parses multipart/form data'],
        [<Status code={500} />, 'Internal Server Error', 'An unhandled exception, e.g. registering without an email field'],
      ]} />
      <p>
        The views set status codes explicitly with constants from <code>rest_framework.status</code>, such as
        <code> status.HTTP_201_CREATED</code>. Named constants are easier to read than bare numbers and protect against typos.
      </p>
      <Callout type="note" title="401 vs 403">
        <strong>401 Unauthorized</strong> means “we don’t know who you are” (authentication failed). <strong>403 Forbidden</strong> means
        “we know who you are, but you may not do this” (authorization failed). This project returns 401 for every auth failure,
        because <code>JWTAuthentication</code> supplies a <code>WWW-Authenticate</code> header, which tells DRF to use 401 rather than 403.
        See <L to="troubleshooting/http-errors" s="403-forbidden">403 Forbidden</L>.
      </Callout>

      <H2>JSON</H2>
      <p>
        <strong>JSON</strong> (JavaScript Object Notation) is a text format for structured data: objects in braces, arrays in
        brackets, strings in double quotes, plus numbers, <code>true</code>, <code>false</code> and <code>null</code>. It is the
        default format DRF renders.
      </p>
      <Code lang="json" file="A product as JSON">{`
{
  "id": 1,
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4 GHz wireless mouse",
  "price": "25.99",
  "image": "/media/products/mouse.png",
  "created_at": "2026-11-21T14:40:12.481203Z"
}
`}</Code>
      <H3>Details to notice</H3>
      <ul>
        <li><strong><code>price</code> is a string.</strong> DRF renders <code>DecimalField</code> values as strings by default (<code>COERCE_DECIMAL_TO_STRING = True</code>) so no precision is lost in floating-point conversion.</li>
        <li><strong><code>created_at</code> is ISO 8601 in UTC.</strong> <code>USE_TZ = True</code> and <code>TIME_ZONE = 'UTC'</code>, hence the trailing <code>Z</code>.</li>
        <li><strong><code>image</code> is a relative URL.</strong> The views do not pass the request to the serializer, so DRF cannot build an absolute URL.</li>
      </ul>
      <H3>JSON in, JSON out, except for uploads</H3>
      <p>
        Register, login, refresh and logout read JSON bodies (<code>Content-Type: application/json</code>). Create and update read
        <strong> multipart/form-data</strong>, because a JSON document cannot carry a binary image file. Every endpoint <em>responds</em>
        with JSON.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
function SerializersAndViews() {
  return (
    <>
      <H2>Serializers</H2>
      <p>A serializer sits between the outside world (JSON, form data) and Python objects (model instances). It has three jobs:</p>
      <Table head={['Job', 'Direction', 'Triggered by']} rows={[
        [<strong>Validation</strong>, 'incoming data → checked data', <code>serializer.is_valid()</code>],
        [<strong>Deserialization</strong>, 'checked data → saved model instance', <code>serializer.save()</code>],
        [<strong>Serialization</strong>, 'model instance → JSON-ready dict', <code>serializer.data</code>],
      ]} />
      <p>How you construct a serializer decides what it does. The project uses all three forms:</p>
      <Code lang="python" file="The three ways views.py constructs serializers">{`
# 1. Create: only incoming data  →  save() calls create()
ProductSerializer(data=request.data)

# 2. Read: only an instance (or a queryset with many=True)  →  use .data
ProductSerializer(product)
ProductSerializer(products, many=True)

# 3. Update: instance + data  →  save() calls update()
ProductSerializer(product, data=request.data, partial=partial)
`}</Code>
      <p>
        When <code>is_valid()</code> returns <code>False</code>, <code>serializer.errors</code> holds a dictionary that maps each failing
        field to a list of messages. The views return that dictionary unchanged with status 400, which is why validation errors
        look like <code>{'{"price": ["A valid number is required."]}'}</code>.
      </p>
      <p>The serializers themselves are covered line by line in <L to="backend/serializers">Creating serializers</L>.</p>

      <H2>API views</H2>
      <p>
        An API view is the function that handles a request for one URL. This project writes every view as a function decorated
        with <code>@api_view</code>, plus decorators that configure it:
      </p>
      <Code lang="python" file="backend/products/views.py" code={CODE.createProduct} mark={['@api_view', '@permission_classes', '@parser_classes']} />
      <dl className="deflist">
        <dt>@api_view(['POST'])</dt><dd>Makes the function a DRF view and lists the accepted methods. It must be the top (outermost) decorator.</dd>
        <dt>@permission_classes([...])</dt><dd>Overrides <code>DEFAULT_PERMISSION_CLASSES</code> for this view only.</dd>
        <dt>@parser_classes([...])</dt><dd>Overrides the default parsers (JSON, form, multipart) for this view only.</dd>
        <dt>request.data</dt><dd>The parsed body. For multipart requests it contains text fields <em>and</em> uploaded files.</dd>
        <dt>Response(data, status)</dt><dd>A DRF response. DRF picks a renderer (JSON here) and serializes <code>data</code>.</dd>
      </dl>
      <Callout type="impl" title="Why function-based views here">
        DRF also offers class-based <code>APIView</code>, generic views such as <code>ListCreateAPIView</code>, and
        <code> ModelViewSet</code>. They collapse this code into a few lines, but they hide the validate–save–respond sequence. This
        project writes it out by hand in every view so that each step is visible. The same knowledge transfers directly once you
        move to generic views.
      </Callout>
    </>
  );
}

/* ------------------------------------------------------------------ */
function AuthVsAuthz() {
  return (
    <>
      <H2>Two different questions</H2>
      <Compare
        left={{ title: 'Authentication: who are you?', body: <p>Verifying identity. In this API, <code>JWTAuthentication</code> checks the token in the <code>Authorization</code> header and sets <code>request.user</code> to the matching <code>User</code>. Failure: <strong>401</strong>.</p> }}
        right={{ title: 'Authorization: what may you do?', body: <p>Deciding access. Permission classes such as <code>IsAuthenticated</code> look at <code>request.user</code> and allow or deny the request. Failure: 401 if unauthenticated, otherwise <strong>403</strong>.</p> }}
      />

      <H2>How this project configures both</H2>
      <p>The defaults live in <code>settings.py</code> and apply to every DRF view:</p>
      <Code lang="python" file="backend/config/settings.py" code={CODE.restAndJwt} mark={['JWTAuthentication', 'IsAuthenticated']} />
      <p>Individual views then opt in or out:</p>
      <Table head={['Endpoint', 'Authentication', 'Permission', 'Effect']} rows={[
        [<code>/api/register/</code>, 'JWTAuthentication (default)', <code>AllowAny</code>, 'Open to anyone; an invalid Bearer header still causes 401'],
        [<code>/api/login/</code>, 'none (authentication_classes = ())', 'none (permission_classes = ())', 'Open to anyone; headers ignored'],
        [<code>/api/token/refresh/</code>, 'none', 'none', 'Open; the refresh token in the body is the credential'],
        [<code>/api/logout/</code>, 'JWTAuthentication', <code>IsAuthenticated</code>, 'Requires a valid access token'],
        ['All product endpoints', 'JWTAuthentication', <code>IsAuthenticated</code>, 'Requires a valid access token'],
      ]} />
      <Callout type="warning" title="AllowAny is not 'ignore authentication'">
        <code>AllowAny</code> skips the permission check, but <code>JWTAuthentication</code> still runs on <code>/api/register/</code>. If a
        client sends an expired or malformed <code>Authorization: Bearer …</code> header to register, the request fails with 401
        before the view runs. Remove the header for public endpoints.
      </Callout>

      <H2>What authorization does not cover yet</H2>
      <p>
        <code>IsAuthenticated</code> only asks whether the user is logged in. Products have no owner field, so any authenticated
        user can update or delete any product. For a multi-user application you would add an <code>owner</code> foreign key and an
        object-level permission. See <L to="best-practices/improvements" s="permissions">Permissions</L>.
      </p>
    </>
  );
}

export default [
  { slug: 'core-concepts/django-vs-drf', group: GROUP, title: 'Django, DRF and the Request Lifecycle', nav: 'Django vs DRF & lifecycle', Body: DjangoVsDrf,
    lede: 'What Django provides, what DRF adds on top, and every step a request passes through before your view runs.' },
  { slug: 'core-concepts/http', group: GROUP, title: 'HTTP Methods, Status Codes and JSON', nav: 'HTTP methods, status & JSON', Body: HttpBasics,
    lede: 'The vocabulary of every API call: what each method means, which status codes this API returns, and how its JSON is shaped.' },
  { slug: 'core-concepts/serializers-and-views', group: GROUP, title: 'Serializers and API Views', Body: SerializersAndViews,
    lede: 'The two building blocks of every endpoint in this project: serializers validate and convert data; API views orchestrate the request.' },
  { slug: 'core-concepts/auth-vs-authz', group: GROUP, title: 'Authentication vs Authorization', Body: AuthVsAuthz,
    lede: 'Identifying the caller versus deciding what the caller may do, and how both are configured in this project.' },
];
