import {
  Callout, Code, H2, H3, L, LinkGrid, Method, Steps, Table, Compare,
} from '../../components/docs.jsx';
import { hrefFor } from '../../lib/router.js';
import { endpoints } from '../endpoints.jsx';

const GROUP = 'Getting Started';

/* ------------------------------------------------------------------ */
function Introduction() {
  return (
    <>
      <header className="home-hero">
        <p className="eyebrow">DRF Atlas · Documentation</p>
        <h1>A Developer’s Guide to Building REST APIs with Django REST Framework</h1>
        <p className="lede" style={{ marginBottom: 0 }}>
          A practical guide to Django REST Framework built around one real project: function-based API views, JWT
          authentication, product CRUD, image uploads, API testing, and frontend integration.
        </p>
        <div className="home-actions">
          <a className="btn primary" href={hrefFor('getting-started/installation')}>Set up the project</a>
          <a className="btn" href={hrefFor('api/overview')}>API reference</a>
          <a className="btn" href={hrefFor('architecture/overview')}>Architecture</a>
        </div>
      </header>

      <H2>About this guide</H2>
      <p>
        DRF Atlas documents a complete, working Django REST Framework backend: a product catalogue API with user
        registration, JWT login and logout, and products that carry an uploaded image. Every code sample comes from the
        project’s source files, and every response shown is what the code actually returns.
      </p>
      <p>
        The project uses <strong>function-based views decorated with <code>@api_view</code></strong> on purpose. Generic views and
        ViewSets do a lot of work for you behind the scenes. Writing each view by hand shows exactly what DRF does on every
        request: parsing input, checking permissions, validating with a serializer, saving, and choosing a status code.
        Once those fundamentals are clear, the higher-level abstractions are easy to adopt.
      </p>
      <Callout type="impl">
        Django 6.1.3 · Django REST Framework 3.18.3 · Simple JWT 5.5.1 · Pillow 13.0.0 · SQLite · Python 3.14.
        Behaviour described here was checked against these versions.
      </Callout>

      <H2>What is an API?</H2>
      <p>
        An <strong>API</strong> (Application Programming Interface) is a contract that lets one program use another program’s
        functionality without knowing how it is implemented. A web API exposes that contract over HTTP: a client sends a
        request to a URL, and the server answers with data, usually in JSON.
      </p>
      <p>
        In this project the server is a Django application. The client can be anything that speaks HTTP: Thunder Client
        inside VS Code while you develop, a React or mobile app later, or another backend service. They all use the same
        endpoints, such as <code>GET /api/products/</code>.
      </p>
      <Code lang="http" file="A request and its response">{`
GET /api/products/1/ HTTP/1.1
Host: 127.0.0.1:8000
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...

HTTP/1.1 200 OK
Content-Type: application/json

{"message": "Product retrieved successfully", "data": {"id": 1, "name": "Wireless Mouse", ...}}
`}</Code>

      <H2>What is REST?</H2>
      <p>
        <strong>REST</strong> (Representational State Transfer) is an architectural style for designing web APIs. It is a set of
        conventions, not a library. The ideas that matter most in practice:
      </p>
      <ul>
        <li><strong>Resources.</strong> The API is organised around things (here: users, tokens and products), each reachable at a URL.</li>
        <li><strong>HTTP methods express intent.</strong> <code>GET</code> reads, <code>POST</code> creates, <code>PUT</code>/<code>PATCH</code> update, <code>DELETE</code> removes.</li>
        <li><strong>Representations.</strong> The server sends a representation of the resource (JSON) rather than the resource itself.</li>
        <li><strong>Statelessness.</strong> Each request carries everything needed to process it. This is why every protected request includes its own JWT instead of relying on a server-side session.</li>
        <li><strong>Status codes carry meaning.</strong> <code>201</code> means created, <code>404</code> means not found, <code>401</code> means not authenticated.</li>
      </ul>
      <Callout type="note" title="Pragmatic REST">
        Strict REST style would use one URL per resource (for example <code>PUT /api/products/1/</code>). This project uses
        explicit action segments such as <code>/products/create/</code> and <code>/products/1/update/</code>. That keeps each
        function-based view tied to one URL and one job, which is easier to follow while learning. The HTTP methods still
        carry their usual meaning.
      </Callout>

      <H2>What is Django REST Framework?</H2>
      <p>
        <strong>Django REST Framework (DRF)</strong> is a toolkit installed on top of Django for building web APIs. Django already
        handles URLs, the ORM, users and security. DRF adds the pieces an API needs:
      </p>
      <Table head={['DRF feature', 'What it does in this project']} rows={[
        [<code>@api_view</code>, 'Turns a plain function into an API view with a DRF Request, error handling, and method checks.'],
        [<><code>Request</code> / <code>request.data</code></>,'Parses JSON, form, and multipart bodies into one dictionary-like object.'],
        [<code>Response</code>, 'Takes Python data and renders it to JSON with the right status code.'],
        [<code>ModelSerializer</code>, 'Validates input and converts Product and User instances to and from JSON.'],
        ['Authentication classes', 'Identify the user from the request. Here: JWTAuthentication from Simple JWT.'],
        ['Permission classes', 'Decide whether that user may proceed: IsAuthenticated or AllowAny.'],
        ['Parsers', 'MultiPartParser and FormParser read file uploads.'],
      ]} />

      <H2>Why DRF?</H2>
      <p>You could return JSON from plain Django views with <code>JsonResponse</code>. DRF earns its place because it removes repetitive, error-prone work:</p>
      <Compare
        left={{ title: 'Plain Django view', body: <ul><li>Parse <code>request.body</code> with <code>json.loads</code> yourself</li><li>Validate each field by hand</li><li>Check the auth header yourself</li><li>Build error dictionaries and status codes manually</li></ul> }}
        right={{ title: 'DRF view', body: <ul><li><code>request.data</code> is already parsed</li><li><code>serializer.is_valid()</code> validates and collects errors</li><li>Authentication and permissions are declarative</li><li>Exceptions become consistent JSON errors</li></ul> }}
      />
      <p>
        DRF is also the most widely used API framework in the Django ecosystem, so packages such as Simple JWT plug into it
        directly.
      </p>

      <H2>How to read this guide</H2>
      <p>Each section builds on the previous one. If you are new to APIs, read in order. If you just need a detail, use search (<kbd>Ctrl</kbd> + <kbd>K</kbd>).</p>
      <LinkGrid items={[
        { to: 'core-concepts/django-vs-drf', title: 'Core Concepts', text: 'HTTP, JSON, serializers, views and the request lifecycle.' },
        { to: 'backend/project-and-app', title: 'Building the Backend', text: 'Settings, the Product model, serializers, views and URLs.' },
        { to: 'jwt/concepts', title: 'JWT Authentication', text: 'Access and refresh tokens, login, logout and blacklisting.' },
        { to: 'crud/create', title: 'Product CRUD', text: 'Create, read, update with PUT or PATCH, and delete.' },
        { to: 'image-upload/fundamentals', title: 'Image Upload', text: 'ImageField, Pillow, multipart parsing and media files.' },
        { to: 'api/overview', title: 'API Reference', text: 'One page per endpoint with requests, responses and errors.' },
        { to: 'testing/thunder-client-setup', title: 'Testing with Thunder Client', text: 'Exercise every endpoint from VS Code.' },
        { to: 'troubleshooting/http-errors', title: 'Troubleshooting', text: 'What 400, 401, 403, 404 and 415 mean here and how to fix them.' },
      ]} />
    </>
  );
}

/* ------------------------------------------------------------------ */
function WhatWeAreBuilding() {
  return (
    <>
      <H2>What we are building</H2>
      <p>
        A REST API for a product catalogue. Anyone can register an account. A registered user logs in to receive JWT tokens,
        then uses the access token to create, list, view, update and delete products. Each product has a name, a description,
        a price, an uploaded image, and a creation timestamp.
      </p>
      <Table className="endpoint-table" head={['Method', 'Endpoint', 'Purpose', 'Auth']} rows={endpoints.map((e) => [
        <Method m={e.method} />,
        <a href={hrefFor(e.slug)}><code>{e.path}</code></a>,
        e.title,
        e.auth ? 'Bearer' : 'Public',
      ])} />

      <H2>Features</H2>
      <H3>Implemented</H3>
      <ul>
        <li>User registration with hashed passwords (<code>User.objects.create_user</code>).</li>
        <li>JWT login at the custom path <code>/api/login/</code>, returning an access and a refresh token.</li>
        <li>Access token refresh at <code>/api/token/refresh/</code>.</li>
        <li>Logout that blacklists the refresh token (<code>rest_framework_simplejwt.token_blacklist</code>).</li>
        <li>Project-wide default: every endpoint requires authentication unless it opts out.</li>
        <li>Full product CRUD with function-based <code>@api_view</code> views.</li>
        <li>PUT (full) and PATCH (partial) updates handled by one view.</li>
        <li>Multipart image upload with <code>MultiPartParser</code> and <code>FormParser</code>.</li>
        <li>Image validation: real image (Pillow), maximum 2 MB, only <code>.jpg</code>, <code>.jpeg</code>, <code>.png</code>.</li>
        <li>Media file serving during development.</li>
        <li>Consistent success envelopes: <code>{'{"message": …, "data": …}'}</code>.</li>
        <li>Product model registered in the Django admin.</li>
      </ul>
      <H3>Not implemented (yet)</H3>
      <p>
        Pagination, filtering, search, per-object ownership, automated tests, CORS headers for browser frontends, and
        production settings. These are covered as suggested next steps in <L to="best-practices/improvements">Improvements</L>.
      </p>

      <H2>Technology stack</H2>
      <Table head={['Technology', 'Version in project', 'Role']} rows={[
        ['Python', '3.14.3', 'Language runtime (Django 6.x requires Python 3.12 or newer).'],
        ['Django', '6.1.3', 'Web framework: URLs, ORM, auth, admin, settings.'],
        ['Django REST Framework', '3.18.3', 'API views, serializers, parsers, authentication/permission hooks.'],
        ['djangorestframework-simplejwt', '5.5.1', 'JWT access/refresh tokens, login and refresh views, blacklist app.'],
        ['PyJWT', '2.15.1', 'Installed automatically; encodes and signs the tokens.'],
        ['Pillow', '13.0.0', 'Image library required by ImageField to verify uploads.'],
        ['SQLite', 'bundled with Python', 'Database file backend/db.sqlite3.'],
        ['Thunder Client', 'VS Code extension', 'Manual API testing.'],
      ]} />
    </>
  );
}

/* ------------------------------------------------------------------ */
function Installation() {
  return (
    <>
      <H2>Prerequisites</H2>
      <ul>
        <li><strong>Python 3.12 or newer.</strong> Django 6 does not support older versions. The project was built with Python 3.14.3.</li>
        <li><strong>pip</strong> and the built-in <code>venv</code> module (both ship with Python).</li>
        <li><strong>VS Code</strong> with the <strong>Thunder Client</strong> extension for testing (any HTTP client works).</li>
        <li>Basic Python knowledge. Some familiarity with Django models and URLs helps but is not required.</li>
      </ul>
      <p>Check your Python version:</p>
      <Code lang="bash">{`
python --version
# Python 3.14.3
`}</Code>

      <H2>Installation and setup</H2>
      <p>The repository root (<code>django_rest_crud_slide/</code>) contains the virtual environment and a <code>backend/</code> folder with the Django project.</p>
      <Steps>
        <li>
          <strong>Create a virtual environment</strong>
          A virtual environment keeps this project’s packages separate from other Python projects.
          <Code lang="bash" file="django_rest_crud_slide/">{`
python -m venv venv
`}</Code>
        </li>
        <li>
          <strong>Activate it</strong>
          <Code lang="bash" file="Windows (PowerShell)">{`
venv\\Scripts\\Activate.ps1
`}</Code>
          <Code lang="bash" file="macOS / Linux">{`
source venv/bin/activate
`}</Code>
          Your prompt shows <code>(venv)</code> when it is active.
        </li>
        <li>
          <strong>Install the packages</strong>
          These are the versions the project runs on. PyJWT, asgiref, sqlparse and tzdata are installed automatically as dependencies.
          <Code lang="bash">{`
pip install django==6.1.3 djangorestframework==3.18.3 djangorestframework-simplejwt==5.5.1 pillow==13.0.0
`}</Code>
        </li>
        <li>
          <strong>Move into the Django project</strong>
          <Code lang="bash">{`
cd backend
`}</Code>
        </li>
        <li>
          <strong>Apply migrations</strong>
          This creates <code>db.sqlite3</code> tables for Django’s auth system, the <code>Product</code> model, and Simple JWT’s
          token blacklist.
          <Code lang="bash">{`
python manage.py migrate
`}</Code>
        </li>
        <li>
          <strong>(Optional) Create an admin user</strong>
          <Code lang="bash">{`
python manage.py createsuperuser
`}</Code>
          The admin at <code>http://127.0.0.1:8000/admin/</code> lets you browse products. This account can also log in through the API.
        </li>
        <li>
          <strong>Start the development server</strong>
          <Code lang="bash">{`
python manage.py runserver
`}</Code>
          <Code lang="text" file="Expected output">{`
Watching for file changes with StatReloader
Performing system checks...

System check identified no issues (0 silenced).
November 22, 2026 - 19:59:24
Django version 6.1.3, using settings 'config.settings'
Starting WSGI development server at http://127.0.0.1:8000/
Quit the server with CTRL-BREAK.

WARNING: This is a development server. Do not use it in a production setting.
`}</Code>
        </li>
      </Steps>

      <Callout type="warning" title="Run manage.py from backend/">
        There are two <code>manage.py</code> files. Use <code>backend/manage.py</code>, which points to <code>config.settings</code>.
        The one in the repository root sets <code>DJANGO_SETTINGS_MODULE</code> to <code>backend.settings</code>, a module that does
        not exist, so commands run from the root fail.
      </Callout>

      <H3>Verify the API is running</H3>
      <p>
        Open <code>http://127.0.0.1:8000/api/products/</code> in a browser or in Thunder Client without a token. A 401 response
        is the expected result: it proves the URL routing, DRF and the global <code>IsAuthenticated</code> permission all work.
      </p>
      <Code lang="json" file="401 Unauthorized">{`
{
  "detail": "Authentication credentials were not provided."
}
`}</Code>
      <Callout type="tip">
        Save your dependencies so the project can be reproduced elsewhere: <code>pip freeze &gt; requirements.txt</code>. The project
        does not include a <code>requirements.txt</code> yet.
      </Callout>
    </>
  );
}

/* ------------------------------------------------------------------ */
function ProjectStructure() {
  return (
    <>
      <H2>Folder layout</H2>
      <div className="code tree">
        <div className="code-head"><span className="code-file">django_rest_crud_slide/</span><span className="code-lang">Tree</span></div>
        <pre><code>{[
          ['django_rest_crud_slide/', 'dir', ''],
          ['├── manage.py', '', '  # stray file, points to backend.settings (unused)'],
          ['├── venv/', 'dir', '  # virtual environment'],
          ['└── backend/', 'dir', '  # the Django project root'],
          ['    ├── manage.py', '', '  # use this one'],
          ['    ├── db.sqlite3', '', '  # SQLite database'],
          ['    ├── media/', 'dir', ''],
          ['    │   └── products/', 'dir', '  # uploaded images (MEDIA_ROOT/products)'],
          ['    ├── config/', 'dir', '  # project package'],
          ['    │   ├── settings.py', '', '  # apps, DRF, JWT and media settings'],
          ['    │   ├── urls.py', '', '  # root URLconf: admin/, api/, media'],
          ['    │   ├── asgi.py', '', ''],
          ['    │   └── wsgi.py', '', ''],
          ['    └── products/', 'dir', '  # the app'],
          ['        ├── models.py', '', '  # Product model'],
          ['        ├── serializers.py', '', '  # RegisterSerializer, ProductSerializer'],
          ['        ├── views.py', '', '  # all @api_view functions'],
          ['        ├── urls.py', '', '  # every /api/ route'],
          ['        ├── admin.py', '', '  # registers Product in the admin'],
          ['        ├── apps.py', '', ''],
          ['        ├── tests.py', '', '  # empty placeholder'],
          ['        └── migrations/0001_initial.py', '', ''],
        ].map(([t, cls, note], i) => (
          <span key={i} className="line"><span className={cls}>{t}</span><span className="note">{note}</span>{'\n'}</span>
        ))}</code></pre>
      </div>

      <H2>What each file does</H2>
      <H3>config/ — the project</H3>
      <p>
        <code>startproject config</code> created this package. <code>settings.py</code> registers the installed apps and holds the
        <code> REST_FRAMEWORK</code>, <code>SIMPLE_JWT</code>, <code>MEDIA_URL</code> and <code>MEDIA_ROOT</code> settings.
        <code> urls.py</code> is the root URLconf: it sends every URL that starts with <code>api/</code> to <code>products/urls.py</code>
        and, while <code>DEBUG</code> is on, serves uploaded media.
      </p>
      <H3>products/ — the app</H3>
      <Table head={['File', 'Responsibility']} rows={[
        [<code>models.py</code>, <>Defines <code>Product</code>, the only custom database table. <L to="backend/product-model">Details</L></>],
        [<code>serializers.py</code>, <>Validation and JSON conversion for users and products. <L to="backend/serializers">Details</L></>],
        [<code>views.py</code>, <>Seven function-based views: register, logout and five product operations. <L to="backend/views">Details</L></>],
        [<code>urls.py</code>, <>Maps URLs to views, including Simple JWT’s login and refresh views. <L to="backend/urls">Details</L></>],
        [<code>admin.py</code>, 'admin.site.register(Product) so products appear in /admin/.'],
        [<code>migrations/</code>, 'The generated migration that creates the products_product table.'],
      ]} />
      <H3>Where things are not</H3>
      <p>
        There is no custom user model: registration uses Django’s built-in <code>django.contrib.auth.models.User</code>. There is
        no separate <code>accounts</code> app: the auth views (<code>register</code>, <code>logout</code>) live in <code>products/views.py</code>
        next to the product views.
      </p>
    </>
  );
}

export default [
  { slug: 'getting-started/introduction', group: GROUP, title: 'Introduction', Body: Introduction,
    lede: 'A Developer’s Guide to Building REST APIs with Django REST Framework.' },
  { slug: 'getting-started/what-we-are-building', group: GROUP, title: 'What We Are Building', nav: 'What we are building', Body: WhatWeAreBuilding,
    lede: 'The product catalogue API at the centre of this guide: its endpoints, its features, and the stack it runs on.' },
  { slug: 'getting-started/installation', group: GROUP, title: 'Installation and Setup', nav: 'Installation', Body: Installation,
    lede: 'Prepare a Python environment, install the dependencies, create the database and start the development server.' },
  { slug: 'getting-started/project-structure', group: GROUP, title: 'Project Structure', Body: ProjectStructure,
    lede: 'A map of the repository and the job of every file you will touch.' },
];
