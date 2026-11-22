import { Callout, Code, H2, H3, L, Table } from '../../components/docs.jsx';
import {
  ArchitectureDiagram, CompleteWorkflowDiagram, CrudMapDiagram, FrontendBackendDiagram, ImageUploadDiagram,
  JwtFlowDiagram, RefreshFlowDiagram, RequestLifecycleDiagram, TokenLifecycleDiagram,
} from '../../diagrams/index.jsx';

const GROUP = 'Architecture and Workflows';

/* ------------------------------------------------------------------ */
function Overview() {
  return (
    <>
      <H2>Project architecture</H2>
      <ArchitectureDiagram />
      <Table head={['Layer', 'Lives in', 'Responsibility']} rows={[
        ['Clients', 'Thunder Client, a future frontend', 'Send HTTP requests; store and attach tokens.'],
        ['Configuration', <code>backend/config/</code>, 'Installed apps, DRF/JWT defaults, media settings, root URLs.'],
        ['Routing', <code>products/urls.py</code>, 'Map 9 URL patterns (10 method/URL combinations) to views.'],
        ['Views', <code>products/views.py</code>, 'Seven @api_view functions: orchestrate auth, validation, persistence and responses.'],
        ['Third-party views', 'rest_framework_simplejwt', 'Login (token pair) and refresh.'],
        ['Serialization', <code>products/serializers.py</code>, 'Validate input; convert models to and from JSON.'],
        ['Data', <code>products/models.py</code>, 'Product model; User comes from django.contrib.auth.'],
        ['Storage', <><code>db.sqlite3</code>, <code>media/</code></>, 'Rows in SQLite; image files on disk.'],
      ]} />
      <H3>Design decisions</H3>
      <ul>
        <li><strong>One app.</strong> Auth views and product views share <code>products/</code>. That is fine at this size; a larger project would move auth into an <code>accounts</code> app.</li>
        <li><strong>Function-based views throughout.</strong> Each view spells out validate → save → respond, which is the point of the project.</li>
        <li><strong>Ready-made views where they add no learning value.</strong> Token issuing and refreshing are delegated to Simple JWT.</li>
        <li><strong>Secure by default.</strong> <code>IsAuthenticated</code> is global; only <code>register</code> opts out.</li>
        <li><strong>Files outside the database.</strong> The model stores a path; bytes live in <code>MEDIA_ROOT</code>.</li>
      </ul>

      <H2>Frontend-to-backend communication</H2>
      <p>
        The API is frontend-agnostic: anything that can send HTTP requests can use it. A browser frontend (React, Vue, plain
        JavaScript) talks to it like this:
      </p>
      <FrontendBackendDiagram />
      <H3>A minimal API client</H3>
      <Code lang="javascript" file="api.js — example frontend code, not part of the project">{`
const API = 'http://127.0.0.1:8000';
let access = null;
let refresh = null;

export async function login(username, password) {
  const res = await fetch(\`\${API}/api/login/\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error('Invalid credentials');
  ({ access, refresh } = await res.json());
}

async function refreshAccess() {
  const res = await fetch(\`\${API}/api/token/refresh/\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh }),
  });
  if (!res.ok) throw new Error('Session expired, log in again');
  ({ access } = await res.json());
}

// Sends a request with the access token; refreshes once on 401.
export async function api(path, options = {}) {
  const send = () => fetch(\`\${API}\${path}\`, {
    ...options,
    headers: { ...options.headers, Authorization: \`Bearer \${access}\` },
  });
  let res = await send();
  if (res.status === 401 && refresh) {
    await refreshAccess();
    res = await send();
  }
  return res;
}

// Usage
const { data } = await (await api('/api/products/')).json();
const imageUrl = API + data[0].image; // image paths are relative

const form = new FormData();
form.append('name', 'Desk Lamp');
form.append('description', 'LED, dimmable');
form.append('price', '34.50');
form.append('image', fileInput.files[0]);
await api('/api/products/create/', { method: 'POST', body: form }); // no Content-Type!
`}</Code>
      <H3>Integration checklist</H3>
      <ul>
        <li><strong>CORS (not configured).</strong> A frontend served from another origin, such as <code>http://localhost:5173</code>, is blocked by the browser until the API sends CORS headers. Install <code>django-cors-headers</code> and allow that origin. Thunder Client is not a browser, so it is not affected.</li>
        <li><strong>Image URLs.</strong> Prefix the relative <code>image</code> path with the API origin, or pass <code>context={'{'}'request': request{'}'}</code> to the serializers so the API returns absolute URLs.</li>
        <li><strong>FormData for create/update.</strong> Never set <code>Content-Type</code> yourself; the browser adds the boundary.</li>
        <li><strong>Token storage.</strong> Keeping tokens in memory is safest against XSS but is lost on reload. <code>localStorage</code> survives reloads but is readable by any script on the page. See <L to="best-practices/security" s="jwt-security">JWT security</L>.</li>
        <li><strong>Logout.</strong> POST the refresh token to <code>/api/logout/</code>, then discard both tokens.</li>
      </ul>
      <Callout type="future" title="Enabling CORS">
        <Code lang="python" file="settings.py — suggested, not in the project">{`
INSTALLED_APPS += ['corsheaders']
MIDDLEWARE.insert(0, 'corsheaders.middleware.CorsMiddleware')
CORS_ALLOWED_ORIGINS = ['http://localhost:5173']
`}</Code>
      </Callout>
    </>
  );
}

/* ------------------------------------------------------------------ */
function Workflows() {
  return (
    <>
      <p>Every important flow in the application, in one place. Each diagram links back to the page that explains the code behind it.</p>

      <H2>Django request lifecycle</H2>
      <RequestLifecycleDiagram />
      <p>Explained in <L to="core-concepts/django-vs-drf" s="request-and-response-lifecycle">Request and response lifecycle</L>.</p>

      <H2>JWT authentication flow</H2>
      <JwtFlowDiagram />
      <p>Explained in <L to="jwt/concepts" s="how-authentication-works">How authentication works</L> and <L to="jwt/simple-jwt-setup" s="token-generation">Token generation</L>.</p>

      <H2>Refresh token flow</H2>
      <RefreshFlowDiagram />
      <TokenLifecycleDiagram />
      <p>Explained in <L to="jwt/refresh-and-protected-endpoints">Refresh workflow and protected endpoints</L>.</p>

      <H2>Product CRUD flow</H2>
      <CrudMapDiagram />
      <p>Explained in <L to="crud/create">Product CRUD</L>.</p>

      <H2>Image upload flow</H2>
      <ImageUploadDiagram />
      <p>Explained in <L to="image-upload/fundamentals">ImageField, Pillow and multipart parsing</L>.</p>

      <H2>Complete application workflow</H2>
      <CompleteWorkflowDiagram />
      <p>Run it end to end with the test plan in <L to="testing/testing-the-api">Testing the API</L>.</p>
    </>
  );
}

export default [
  { slug: 'architecture/overview', group: GROUP, title: 'Architecture and Frontend Integration', nav: 'Architecture & frontend', Body: Overview,
    lede: 'How the project is layered, why it is built this way, and how a frontend application communicates with it.' },
  { slug: 'architecture/workflows', group: GROUP, title: 'Workflows', nav: 'All workflows', Body: Workflows,
    lede: 'Request lifecycle, authentication, refresh, CRUD, image upload and the complete session, as diagrams.' },
];
