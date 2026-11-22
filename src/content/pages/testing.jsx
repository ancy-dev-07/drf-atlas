import { Callout, Code, H2, H3, L, Method, Status, Steps, Table, BodyKind } from '../../components/docs.jsx';

const GROUP = 'Testing With Thunder Client';

/* ------------------------------------------------------------------ */
function Setup() {
  return (
    <>
      <p>
        <strong>Thunder Client</strong> is a lightweight REST client that runs inside VS Code, so you can test the API without leaving
        the editor. Everything on these pages also works in Postman, Insomnia, or curl.
      </p>

      <H2>Installing Thunder Client</H2>
      <Steps>
        <li><strong>Open Extensions</strong>In VS Code press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> (<kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>X</kbd> on macOS).</li>
        <li><strong>Search</strong>Type “Thunder Client” and install the extension published by Thunder Client (Ranga Vadhineni).</li>
        <li><strong>Open it</strong>A lightning-bolt icon appears in the Activity Bar. Click it to open the Thunder Client sidebar.</li>
        <li><strong>Start the API</strong>In a terminal: <code>cd backend</code> then <code>python manage.py runserver</code>. Keep it running while you test.</li>
      </Steps>

      <H2>Creating requests</H2>
      <p>Click <em>New Request</em>. A request tab opens with:</p>
      <ul>
        <li>a <strong>method</strong> dropdown and a <strong>URL</strong> bar with a <em>Send</em> button;</li>
        <li>tabs for <strong>Query</strong>, <strong>Headers</strong>, <strong>Auth</strong>, <strong>Body</strong> and <strong>Tests</strong>;</li>
        <li>a <strong>response panel</strong> showing status, time, size, headers and body.</li>
      </ul>
      <Callout type="tip" title="Organise with a collection and an environment">
        Save each request into a collection named “DRF Atlas” so the full flow can be re-run. Create an environment with
        variables such as <code>baseUrl = http://127.0.0.1:8000</code> and <code>access</code>, then write URLs as
        <code> {'{{baseUrl}}'}/api/products/</code> and the bearer token as <code>{'{{access}}'}</code>. When the token changes,
        you update it in one place.
      </Callout>

      <H2>Selecting HTTP methods</H2>
      <p>Pick the method from the dropdown to the left of the URL. Each endpoint accepts only the methods listed in its view’s <code>@api_view</code>; others return 405.</p>
      <Table head={['Endpoint', 'Method to select']} rows={[
        [<code>/api/register/</code>, <Method m="POST" />],
        [<code>/api/login/</code>, <Method m="POST" />],
        [<code>/api/token/refresh/</code>, <Method m="POST" />],
        [<code>/api/logout/</code>, <Method m="POST" />],
        [<code>/api/products/create/</code>, <Method m="POST" />],
        [<code>/api/products/</code>, <Method m="GET" />],
        [<code>/api/products/{'{id}'}/</code>, <Method m="GET" />],
        [<code>/api/products/{'{id}'}/update/</code>, <><Method m="PUT" /> or <Method m="PATCH" /></>],
        [<code>/api/products/{'{id}'}/delete/</code>, <Method m="DELETE" />],
      ]} />

      <H2>Setting Bearer authentication</H2>
      <Steps>
        <li><strong>Log in first</strong>Send <code>POST /api/login/</code> and copy the <code>access</code> value from the response (without the quotes).</li>
        <li><strong>Auth tab → Bearer</strong>In any protected request, open <em>Auth</em>, choose <em>Bearer</em>, and paste the token. Thunder Client sends <code>Authorization: Bearer &lt;token&gt;</code>.</li>
        <li><strong>Or set it once</strong>Collection settings can define Auth for every request, and requests can inherit it.</li>
      </Steps>
      <Callout type="warning">
        Paste only the token into the Bearer field; Thunder Client adds the word <code>Bearer</code> itself. If you set the header
        manually in the Headers tab instead, the value must be <code>Bearer &lt;token&gt;</code> with exactly one space.
      </Callout>

      <H2>Sending JSON</H2>
      <p>For register, login, refresh and logout, open <em>Body</em> → <em>JSON</em> and type the document. Thunder Client sets <code>Content-Type: application/json</code>.</p>
      <Code lang="json" file="Body → JSON · POST /api/login/">{`
{
  "username": "atlas_dev",
  "password": "StrongPass#2026"
}
`}</Code>
      <p>JSON must use double quotes and no trailing commas. A syntax error produces a 400 with a JSON parse error message.</p>

      <H2>Uploading files</H2>
      <p>For create and update, open <em>Body</em> → <em>Form</em>. Add text fields as key/value rows, enable <em>Files</em>, and add <code>image</code> as a file field. The request is sent as <BodyKind kind="multipart" />.</p>
      <p>The full step-by-step walkthrough is in <L to="image-upload/thunder-client-upload">Uploading images through Thunder Client</L>.</p>
    </>
  );
}

/* ------------------------------------------------------------------ */
function TestingTheApi() {
  return (
    <>
      <p>Run these requests in order on a fresh database. Each row lists the expected status, so you can verify every behaviour of the API in about ten minutes.</p>

      <H2>Testing JWT authentication</H2>
      <Table head={['#', 'Request', 'Body / auth', 'Expect']} rows={[
        ['1', <><Method m="POST" /> <code>/api/register/</code></>, <>JSON: username, email, password</>, <Status code={201} />],
        ['2', <><Method m="POST" /> <code>/api/register/</code></>, 'Same username again', <><Status code={400} /> username already exists</>],
        ['3', <><Method m="POST" /> <code>/api/login/</code></>, 'Wrong password', <><Status code={401} /> No active account…</>],
        ['4', <><Method m="POST" /> <code>/api/login/</code></>, 'Correct credentials', <><Status code={200} /> save refresh + access</>],
        ['5', <><Method m="POST" /> <code>/api/token/refresh/</code></>, <>JSON: <code>{'{"refresh": "…"}'}</code></>, <><Status code={200} /> new access</>],
        ['6', <><Method m="POST" /> <code>/api/token/refresh/</code></>, 'Send the access token as "refresh"', <><Status code={401} /> Token has wrong type</>],
      ]} />
      <p>Logout is tested at the end, after CRUD, because it revokes the refresh token you are using.</p>

      <H2>Testing CRUD endpoints</H2>
      <p>All rows use Auth → Bearer with the access token from step 4 (or 5).</p>
      <Table head={['#', 'Request', 'Body', 'Expect']} rows={[
        ['7', <><Method m="GET" /> <code>/api/products/</code></>, '—', <><Status code={200} /> <code>"data": []</code></>],
        ['8', <><Method m="POST" /> <code>/api/products/create/</code></>, 'Form: name, description, price, image', <><Status code={201} /> note the id</>],
        ['9', <><Method m="POST" /> <code>/api/products/create/</code></>, 'Body → JSON instead of Form', <Status code={415} />],
        ['10', <><Method m="POST" /> <code>/api/products/create/</code></>, 'Form with a .gif image', <><Status code={400} /> Only JPG, JPEG and PNG…</>],
        ['11', <><Method m="GET" /> <code>/api/products/</code></>, '—', <><Status code={200} /> one product</>],
        ['12', <><Method m="GET" /> <code>/api/products/1/</code></>, '—', <Status code={200} />],
        ['13', <><Method m="GET" /> <code>/api/products/999/</code></>, '—', <><Status code={404} /> No Product matches…</>],
        ['14', <><Method m="PUT" /> <code>/api/products/1/update/</code></>, 'Form without image', <><Status code={400} /> No file was submitted.</>],
        ['15', <><Method m="PUT" /> <code>/api/products/1/update/</code></>, 'Form: all four fields', <Status code={200} />],
        ['16', <><Method m="PATCH" /> <code>/api/products/1/update/</code></>, 'Form: price only', <><Status code={200} /> other fields unchanged</>],
        ['17', <><Method m="DELETE" /> <code>/api/products/1/delete/</code></>, '—', <><Status code={200} /> deleted message</>],
        ['18', <><Method m="DELETE" /> <code>/api/products/1/delete/</code></>, '—', <Status code={404} />],
      ]} />

      <H2>Testing unauthorized requests</H2>
      <p>Deliberately break authentication to confirm every product endpoint is protected:</p>
      <Table head={['#', 'Variation', 'Expect']} rows={[
        ['19', 'Auth tab set to “No Auth”', <><Status code={401} /> Authentication credentials were not provided.</>],
        ['20', 'Header Authorization: <token> without “Bearer”', <><Status code={401} /> Authentication credentials were not provided.</>],
        ['21', 'Bearer with one character of the token changed', <><Status code={401} /> token_not_valid · Token is invalid</>],
        ['22', 'Bearer with the refresh token instead of access', <><Status code={401} /> Token has wrong type</>],
        ['23', 'Wait 30+ minutes, reuse the old access token', <><Status code={401} /> Token is expired</>],
      ]} />
      <H3>Finally: logout</H3>
      <Table head={['#', 'Request', 'Body / auth', 'Expect']} rows={[
        ['24', <><Method m="POST" /> <code>/api/logout/</code></>, 'Bearer access, JSON {} (no refresh)', <><Status code={400} /> Refresh token is required</>],
        ['25', <><Method m="POST" /> <code>/api/logout/</code></>, <>Bearer access, JSON <code>{'{"refresh": "…"}'}</code></>, <Status code={205} />],
        ['26', <><Method m="POST" /> <code>/api/logout/</code></>, 'Same body again', <><Status code={400} /> Invalid or already blacklisted…</>],
        ['27', <><Method m="POST" /> <code>/api/token/refresh/</code></>, 'The logged-out refresh token', <><Status code={401} /> Token is blacklisted</>],
        ['28', <><Method m="GET" /> <code>/api/products/</code></>, 'The old access token (within 30 min)', <><Status code={200} /> access tokens are not revoked</>],
      ]} />
      <Callout type="note">Row 28 surprises many people: it is correct behaviour for stateless JWTs. See <L to="jwt/logout-and-blacklisting" s="what-blacklisting-does-not-do">What blacklisting does not do</L>.</Callout>

      <H2>Understanding HTTP responses</H2>
      <p>Thunder Client’s response panel shows everything you need to diagnose a request:</p>
      <Table head={['Element', 'What to look for']} rows={[
        ['Status', <>The first thing to check. <code>2xx</code> = success; <code>4xx</code> = fix the request; <code>5xx</code> = check the runserver terminal.</>],
        ['Time', 'Usually a few milliseconds locally. Uploads take longer.'],
        ['Size', 'Body size. A 205 logout response is small; a product list grows with your data.'],
        ['Headers', <><code>Content-Type: application/json</code> for API responses; <code>WWW-Authenticate: Bearer realm="api"</code> on 401s from JWT auth; <code>Allow</code> on 405s.</>],
        ['Response body', <>Read <code>message</code>/<code>data</code> on success, or the field errors / <code>detail</code> / <code>error</code> keys on failure.</>],
      ]} />
      <Callout type="tip" title="Automate checks">
        The <em>Tests</em> tab can assert results without reading them, for example “ResponseCode equal 201” or
        “json.data.name equal Wireless Mouse”. It can also copy a JSON value, such as <code>json.access</code>, into an environment
        variable, so the token is updated automatically after each login.
      </Callout>
      <Callout type="future" title="Automated tests in code">
        Manual testing finds problems; automated tests prevent them from coming back. <code>products/tests.py</code> is currently
        empty. A starting point is in <L to="best-practices/improvements" s="testing">Testing</L>.
      </Callout>
    </>
  );
}

export default [
  { slug: 'testing/thunder-client-setup', group: GROUP, title: 'Thunder Client Setup', nav: 'Setup & requests', Body: Setup,
    lede: 'Install Thunder Client and learn how to build requests: methods, Bearer authentication, JSON bodies and file uploads.' },
  { slug: 'testing/testing-the-api', group: GROUP, title: 'Testing the API', nav: 'Testing every endpoint', Body: TestingTheApi,
    lede: 'A complete, ordered test plan for authentication, CRUD, unauthorized access and logout, with the expected result of each request.' },
];
