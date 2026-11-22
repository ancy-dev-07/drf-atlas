import {
  BodyKind, Callout, Code, EndpointBar, H2, H3, L, Method, Status, Table, Tabs,
} from '../../components/docs.jsx';
import { hrefFor } from '../../lib/router.js';
import { endpoints } from '../endpoints.jsx';

const GROUP = 'API Reference';
const BASE = 'http://127.0.0.1:8000';

const STATUS_TEXT = { 200: 'OK', 201: 'Created', 205: 'Reset Content', 400: 'Bad Request', 401: 'Unauthorized', 404: 'Not Found', 405: 'Method Not Allowed', 415: 'Unsupported Media Type' };

function curlFor(e) {
  const url = BASE + e.path.replace('{id}', '1');
  const lines = [`curl -X ${e.method} ${url}`];
  if (e.auth) lines.push('  -H "Authorization: Bearer <access_token>"');
  if (e.kind === 'json') {
    lines.push('  -H "Content-Type: application/json"');
    lines.push(`  -d '${e.request.replace(/\s*\n\s*/g, ' ')}'`);
  }
  if (e.kind === 'multipart') {
    e.requestForm.split('\n').forEach((l) => {
      const [k, ...rest] = l.trim().split(/\s{2,}/);
      const v = rest.join(' ');
      if (v.startsWith('[file]')) lines.push(`  -F "${k}=@${v.replace('[file] ', '')}"`);
      else lines.push(`  -F "${k}=${v}"`);
    });
  }
  return lines.join(' \\\n');
}

function fetchFor(e) {
  const url = BASE + e.path.replace('{id}', '1');
  const headers = [];
  if (e.auth) headers.push('Authorization: `Bearer ${access}`');
  if (e.kind === 'json') headers.push("'Content-Type': 'application/json'");
  let body = '';
  let pre = '';
  if (e.kind === 'json') body = `\n  body: JSON.stringify(${e.request.replace(/\n/g, '\n  ')}),`;
  if (e.kind === 'multipart') {
    pre = 'const form = new FormData();\n' + e.requestForm.split('\n').map((l) => {
      const [k, ...rest] = l.trim().split(/\s{2,}/);
      const v = rest.join(' ');
      return v.startsWith('[file]') ? `form.append('${k}', fileInput.files[0]);` : `form.append('${k}', '${v}');`;
    }).join('\n') + '\n\n';
    body = '\n  body: form, // the browser sets the multipart boundary';
  }
  const h = headers.length ? `\n  headers: { ${headers.join(', ')} },` : '';
  return `${pre}const res = await fetch('${url}', {\n  method: '${e.method}',${h}${body}\n});\nconst data = await res.json();`;
}

function httpFor(e) {
  const p = e.path.replace('{id}', '1');
  const lines = [`${e.method} ${p} HTTP/1.1`, 'Host: 127.0.0.1:8000'];
  if (e.auth) lines.push('Authorization: Bearer <access_token>');
  if (e.kind === 'json') lines.push('Content-Type: application/json', '', e.request.replace(/\s*\n\s*/g, ' ').replace('{ ', '{').replace(' }', '}'));
  if (e.kind === 'multipart') lines.push('Content-Type: multipart/form-data; boundary=----TCBoundary', '', '(form parts — see Request body)');
  return lines.join('\n');
}

function EndpointPage({ e }) {
  return (
    <>
      <EndpointBar method={e.method} path={e.path} auth={e.auth} />

      <Table head={['Property', 'Value']} rows={[
        ['HTTP method', <Method m={e.method} />],
        ['URL', <code>{e.path}</code>],
        ['Handled by', <code>{e.view}</code>],
        ['Authentication', e.auth ? <>Required: <code>Authorization: Bearer &lt;access_token&gt;</code></> : 'None (public)'],
        ['Request body', <BodyKind kind={e.kind} />],
        ['Success status', <Status code={e.success.status} text={e.success.text} />],
      ]} />

      {e.warning && <Callout type="warning">{e.warning}</Callout>}

      {e.params && (
        <>
          <H2>Path parameters</H2>
          <Table head={['Name', 'Type', 'Description']} rows={e.params.map(([n, t, d]) => [<code>{n}</code>, t, d])} />
        </>
      )}

      <H2>Request headers</H2>
      <Table head={['Header', 'Value', 'Required']} rows={e.headers.map(([h, v, r]) => [<code>{h}</code>, <code>{v}</code>, r])} />

      <H2>Request body</H2>
      {e.kind === 'none' && <p>This endpoint takes no request body. Everything it needs is in the URL and the Authorization header.</p>}
      {e.kind === 'json' && (
        <>
          <p>Send a <strong>JSON</strong> document. In Thunder Client: Body → <em>JSON</em>.</p>
          <Table head={['Field', 'Type', 'Required', 'Notes']} rows={e.fields.map(([f, t, r, n]) => [<code>{f}</code>, t, r, n])} />
          <Code lang="json" file="application/json" code={e.request} />
        </>
      )}
      {e.kind === 'multipart' && (
        <>
          <p>
            Send <strong>multipart/form-data</strong>, not JSON. In Thunder Client: Body → <em>Form</em>, with <code>image</code> added as a
            file field. JSON bodies are rejected with 415.
          </p>
          <Table head={['Field', 'Part type', 'Required', 'Notes']} rows={e.fields.map(([f, t, r, n]) => [<code>{f}</code>, t, r, n])} />
          <Code lang="text" file="multipart/form-data fields" code={e.requestForm} />
        </>
      )}

      <H2>Example request</H2>
      <Tabs items={[
        { label: 'HTTP', content: <Code lang="http" code={httpFor(e)} /> },
        { label: 'curl', content: <Code lang="bash" code={curlFor(e)} /> },
        { label: 'JavaScript (fetch)', content: <Code lang="javascript" code={fetchFor(e)} /> },
      ]} />

      <H2>Success response</H2>
      <Code lang="json" file={`${e.success.status} ${e.success.text}`} code={e.success.body} />

      <H2>Error responses</H2>
      <Table head={['Status', 'When']} rows={e.errors.map((er) => [<Status code={er.status} />, er.when])} />
      {e.errors.map((er, i) => (
        <Code key={i} lang="json" file={`${er.status} ${STATUS_TEXT[er.status] || ''} · ${er.when}`} code={er.body} />
      ))}

      <H2>Explanation</H2>
      {e.explain}
    </>
  );
}

function Overview() {
  return (
    <>
      <H2>Base URL</H2>
      <p>During development every endpoint lives under:</p>
      <Code lang="text">{BASE + '/api/'}</Code>

      <H2>Endpoints</H2>
      <Table className="endpoint-table" head={['Method', 'Endpoint', 'Purpose', 'Auth', 'Body']} rows={endpoints.map((e) => [
        <Method m={e.method} />,
        <a href={hrefFor(e.slug)}><code>{e.path}</code></a>,
        e.title,
        e.auth ? 'Bearer' : 'Public',
        <BodyKind kind={e.kind} />,
      ])} />

      <H2>Conventions</H2>
      <H3>Authentication</H3>
      <p>
        Endpoints marked <strong>Bearer</strong> need <code>Authorization: Bearer &lt;access_token&gt;</code>. Obtain tokens from
        <L to="api/login"> POST /api/login/</L> (not <code>/api/token/</code>).
      </p>
      <H3>Request bodies</H3>
      <ul>
        <li><BodyKind kind="json" /> for register, login, refresh and logout.</li>
        <li><BodyKind kind="multipart" /> for create and update (PUT and PATCH), because they carry an image file.</li>
      </ul>
      <H3>Responses</H3>
      <p>
        All responses are JSON. Project views wrap results as <code>{'{"message": "...", "data": ...}'}</code>; Simple JWT views
        return raw token objects. Errors use field-error objects, <code>{'{"detail": ...}'}</code>, or <code>{'{"error": ...}'}</code>;
        see <L to="crud/responses-and-errors">Response formats and error handling</L>.
      </p>
      <H3>Trailing slashes</H3>
      <p>Every URL ends with <code>/</code>. Omitting it on a POST, PUT, PATCH or DELETE causes an error instead of a redirect.</p>
      <H3>Product object</H3>
      <Table head={['Field', 'Type', 'Writable', 'Description']} rows={[
        [<code>id</code>, 'integer', 'No', 'Primary key'],
        [<code>name</code>, 'string (≤ 100)', 'Yes', 'Product name'],
        [<code>description</code>, 'string', 'Yes', 'Free text'],
        [<code>price</code>, 'string (decimal)', 'Yes', 'Up to 10 digits, 2 decimal places, e.g. "25.99"'],
        [<code>image</code>, 'string (URL path)', 'Yes (as file)', 'Upload a file; read back as /media/products/…'],
        [<code>created_at</code>, 'string (ISO 8601, UTC)', 'No', 'Set on creation'],
      ]} />
    </>
  );
}

export default [
  { slug: 'api/overview', group: GROUP, title: 'API Reference', nav: 'Overview', Body: Overview,
    lede: 'Every endpoint of the DRF Atlas API with its method, authentication and body format. Select an endpoint for full details.' },
  ...endpoints.map((e) => ({
    slug: e.slug,
    group: GROUP,
    title: e.title,
    nav: e.nav || e.title,
    method: e.method,
    lede: e.summary,
    Body: () => <EndpointPage e={e} />,
  })),
];
