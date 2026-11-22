/**
 * The DRF Atlas diagram set. Every diagram describes the actual behaviour of
 * this project (Django 6.1, DRF 3.18, Simple JWT 5.5, function-based views).
 */
import { Figure } from '../components/docs.jsx';
import { Flow, Markers, Sequence, useMarkerIds } from './primitives.jsx';

/* 1. DRF request / response lifecycle -------------------------------- */
export function RequestLifecycleDiagram() {
  return (
    <Figure title="DRF request–response lifecycle"
      caption="What happens to an authenticated request such as POST /api/products/create/. Dashed red arrows show where the request can leave the pipeline early with an error response.">
      <Flow title="DRF request response lifecycle" stages={[
        { title: 'HTTP client', sub: 'Thunder Client or a frontend sends the request', tone: 'muted' },
        { title: 'Django middleware', sub: 'Security → Session → Common → Csrf → Auth → …' },
        { title: 'URL resolver', sub: ['config/urls.py: "api/" → products/urls.py'], mono: true },
        { title: '@api_view wrapper', sub: 'Wraps HttpRequest in a DRF Request', tag: 'APIView.dispatch' },
        { title: 'Authentication', sub: 'JWTAuthentication reads "Authorization: Bearer …"', tone: 'accent',
          branch: { label: 'bad token', title: '401 token_not_valid', sub: ['expired / tampered token'] } },
        { title: 'Permission check', sub: 'IsAuthenticated (AllowAny on register)', tone: 'accent',
          branch: { label: 'no token', title: '401 Not authenticated', sub: ['credentials not provided'] } },
        { title: 'Method check', sub: 'Is request.method listed in @api_view([...])?',
          branch: { label: 'not listed', title: '405 Method Not Allowed', sub: [] } },
        { title: 'Your view function', sub: 'request.data parsed by the view’s parser classes', tone: 'brass',
          branch: { label: 'wrong type', title: '415 Unsupported Media', sub: ['e.g. JSON sent to upload'] } },
        { title: 'Object lookup (detail routes)', sub: 'get_object_or_404(Product, id=pk)',
          branch: { label: 'missing id', title: '404 Not Found', sub: ['No Product matches…'] } },
        { title: 'Serializer', sub: 'is_valid(): field checks + validate_image()',
          branch: { label: 'invalid', title: '400 Bad Request', sub: ['serializer.errors'] } },
        { title: 'Model / ORM → SQLite', sub: 'serializer.save() · product.delete()' },
        { title: 'Response', sub: 'JSONRenderer → status code + JSON body', tone: 'accent' },
      ]} />
    </Figure>
  );
}

/* 2. JWT login + authenticated request -------------------------------- */
export function JwtFlowDiagram() {
  return (
    <Figure title="JWT authentication workflow"
      caption="Login exchanges credentials for a token pair once. Every later request carries only the access token; the server verifies its signature instead of looking up a session.">
      <Sequence title="JWT authentication workflow" colW={180} actors={[
        { label: 'Client', sub: 'Thunder Client / app' },
        { label: '/api/login/', sub: 'TokenObtainPairView', tone: 'accent' },
        { label: 'Product views', sub: '@api_view functions', tone: 'brass' },
        { label: 'Database', sub: 'SQLite' },
      ]} steps={[
        { from: 0, to: 1, label: 'POST {username, password}' },
        { from: 1, to: 3, label: 'authenticate(): check hash' },
        { from: 3, to: 1, label: 'User', kind: 'res' },
        { from: 1, to: 3, label: 'save OutstandingToken' },
        { from: 1, to: 1, label: 'sign with SECRET_KEY' },
        { from: 1, to: 0, label: '200 {refresh, access}', kind: 'ok' },
        { divider: 'every protected request' },
        { from: 0, to: 2, label: 'Authorization: Bearer <access>' },
        { from: 2, to: 2, label: 'verify signature + exp' },
        { from: 2, to: 3, label: 'load User(user_id) · query' },
        { from: 3, to: 2, label: 'rows', kind: 'res' },
        { from: 2, to: 0, label: '200 {message, data}', kind: 'ok' },
      ]} />
    </Figure>
  );
}

/* 3. Refresh workflow ------------------------------------------------ */
export function RefreshFlowDiagram() {
  return (
    <Figure title="Refresh token workflow"
      caption="When the 30-minute access token expires, the client trades its refresh token for a new access token. Because ROTATE_REFRESH_TOKENS is not enabled, the same refresh token is reused until it expires (1 day) or is blacklisted at logout.">
      <Sequence title="Refresh token workflow" colW={186} actors={[
        { label: 'Client' },
        { label: 'Product views', tone: 'brass' },
        { label: '/api/token/refresh/', sub: 'TokenRefreshView', tone: 'accent' },
        { label: 'Database', sub: 'token_blacklist' },
      ]} steps={[
        { from: 0, to: 1, label: 'Bearer <expired access>' },
        { from: 1, to: 0, label: '401 "Token is expired"', kind: 'err' },
        { from: 0, to: 2, label: 'POST {"refresh": "…"}' },
        { from: 2, to: 2, label: 'verify signature + exp' },
        { from: 2, to: 3, label: 'is jti blacklisted?' },
        { from: 3, to: 2, label: 'no', kind: 'res' },
        { from: 2, to: 0, label: '200 {"access": "<new>"}', kind: 'ok' },
        { from: 0, to: 1, label: 'retry: Bearer <new access>' },
        { from: 1, to: 0, label: '200 OK', kind: 'ok' },
        { divider: 'after POST /api/logout/' },
        { from: 0, to: 2, label: 'POST {"refresh": "…"}' },
        { from: 2, to: 3, label: 'is jti blacklisted?' },
        { from: 3, to: 2, label: 'yes', kind: 'res' },
        { from: 2, to: 0, label: '401 "Token is blacklisted"', kind: 'err' },
      ]} />
    </Figure>
  );
}

/* 4. Logout ----------------------------------------------------------- */
export function LogoutFlowDiagram() {
  return (
    <Figure title="Logout and blacklisting"
      caption="Logout needs both tokens: the access token authenticates the request, and the refresh token in the body is the one that gets blacklisted.">
      <Sequence title="Logout flow" colW={200} actors={[
        { label: 'Client' },
        { label: 'logout()', sub: 'POST /api/logout/', tone: 'brass' },
        { label: 'Database', sub: 'token_blacklist' },
      ]} steps={[
        { from: 0, to: 1, label: 'Bearer <access> + {"refresh"}' },
        { from: 1, to: 1, label: 'IsAuthenticated passes' },
        { from: 1, to: 1, label: 'RefreshToken(refresh)' },
        { from: 1, to: 2, label: 'token.blacklist()' },
        { from: 2, to: 1, label: 'BlacklistedToken row', kind: 'res' },
        { from: 1, to: 0, label: '205 "Logout successful"', kind: 'ok' },
        { divider: 'same refresh token again' },
        { from: 0, to: 1, label: 'POST {"refresh"}' },
        { from: 1, to: 1, label: 'TokenError: blacklisted' },
        { from: 1, to: 0, label: '400 "Invalid or already …"', kind: 'err' },
      ]} />
    </Figure>
  );
}

/* 5. Token lifecycle timeline ---------------------------------------- */
export function TokenLifecycleDiagram() {
  const ids = useMarkerIds();
  const W = 740;
  const x0 = 150;
  const pxPerH = 120; // first 3 hours linear
  const breakX = x0 + 3 * pxPerH; // 510
  const tailX = breakX + 40; // 550 => 23h
  const endX = tailX + pxPerH; // 670 => 24h
  const tx = (h) => (h <= 3 ? x0 + h * pxPerH : tailX + (h - 23) * pxPerH);
  const access = [0, 0.5, 1, 1.5, 2, 2.5, 23, 23.5];
  const laneY = { refresh: 40, access: 92, logout: 176 };

  return (
    <Figure title="Access and refresh token lifecycle"
      caption="Lifetimes come from SIMPLE_JWT in settings.py: ACCESS_TOKEN_LIFETIME = 30 minutes, REFRESH_TOKEN_LIFETIME = 1 day. The axis is compressed between 3 h and 23 h. Bottom lane: blacklisting the refresh token at logout does not revoke an access token that is already issued; it stays valid until its own expiry.">
      <svg viewBox={`0 0 ${W} 250`} width={W} role="img" aria-label="Token lifecycle timeline">
        <title>Token lifecycle timeline</title>
        <Markers ids={ids} />
        {/* axis */}
        <line x1={x0} x2={breakX} y1={140} y2={140} className="d-line" />
        <line x1={tailX} x2={endX} y1={140} y2={140} className="d-line" />
        <text x={(breakX + tailX) / 2} y={144} textAnchor="middle" className="d-faint">≈</text>
        {[0, 1, 2, 3].map((h) => (
          <g key={h}>
            <line x1={tx(h)} x2={tx(h)} y1={136} y2={144} className="d-line" />
            <text x={tx(h)} y={157} textAnchor="middle" className="d-mono">{h}h</text>
          </g>
        ))}
        {[23, 24].map((h) => (
          <g key={h}>
            <line x1={tx(h)} x2={tx(h)} y1={136} y2={144} className="d-line" />
            <text x={tx(h)} y={157} textAnchor="middle" className="d-mono">{h}h</text>
          </g>
        ))}

        {/* refresh lane */}
        <text x={14} y={laneY.refresh + 4} className="d-title">Refresh token</text>
        <text x={14} y={laneY.refresh + 18} className="d-faint">one, from login</text>
        <rect x={x0} y={laneY.refresh - 9} width={breakX - x0} height={18} rx="3" className="d-bar-refresh" />
        <rect x={tailX} y={laneY.refresh - 9} width={endX - tailX} height={18} rx="3" className="d-bar-refresh" />
        <text x={x0 + 8} y={laneY.refresh + 4} className="d-label" style={{ fill: 'var(--bg)' }}>REFRESH_TOKEN_LIFETIME = 1 day</text>
        <line x1={endX} x2={endX} y1={laneY.refresh - 16} y2={laneY.access + 16} className="d-line danger dashed" />
        <text x={endX + 6} y={laneY.refresh - 4} className="d-danger-text">expires</text>
        <text x={endX + 6} y={laneY.refresh + 10} className="d-danger-text">→ log in</text>
        <text x={endX + 6} y={laneY.refresh + 24} className="d-danger-text">again</text>

        {/* access lane */}
        <text x={14} y={laneY.access + 4} className="d-title">Access tokens</text>
        <text x={14} y={laneY.access + 18} className="d-faint">a new one each refresh</text>
        {access.map((h, i) => (
          <g key={h}>
            <rect x={tx(h) + 1} y={laneY.access - 9} width={pxPerH / 2 - 3} height={18} rx="3" className="d-bar-access" />
            {i > 0 && h !== 23 && (
              <line x1={tx(h)} y1={laneY.access - 26} x2={tx(h)} y2={laneY.access - 11}
                className="d-line accent" markerEnd={`url(#${ids.acc})`} />
            )}
          </g>
        ))}
        <text x={tx(0) + 6} y={laneY.access + 4} className="d-label" style={{ fill: 'var(--bg)' }}>30m</text>
        <text x={tx(0.5)} y={laneY.access - 30} textAnchor="middle" className="d-accent-text">POST /api/token/refresh/</text>

        {/* logout lane */}
        <text x={14} y={laneY.logout + 4} className="d-title">Logout at 20 min</text>
        <text x={14} y={laneY.logout + 18} className="d-faint">what still works</text>
        <rect x={x0} y={laneY.logout - 9} width={pxPerH / 3} height={18} rx="3" className="d-bar-refresh" />
        <rect x={x0 + pxPerH / 3} y={laneY.logout - 9} width={breakX - x0 - pxPerH / 3} height={18} rx="3" className="d-bar-dead" opacity="0.25" />
        <rect x={x0} y={laneY.logout + 13} width={pxPerH / 2 - 2} height={10} rx="2" className="d-bar-access" />
        <line x1={x0 + pxPerH / 3} x2={x0 + pxPerH / 3} y1={laneY.logout - 18} y2={laneY.logout + 28} className="d-line danger" />
        <text x={x0 + pxPerH / 3 + 6} y={laneY.logout - 14} className="d-danger-text">logout: refresh blacklisted</text>
        <text x={x0 + pxPerH / 2 + 6} y={laneY.logout + 22} className="d-accent-text">access still valid until 30m</text>
        <text x={x0 + 190} y={laneY.logout + 4} className="d-danger-text">refresh → 401 "Token is blacklisted"</text>

        <rect x={x0} y={226} width={14} height={10} className="d-bar-refresh" />
        <text x={x0 + 20} y={235} className="d-faint">refresh token</text>
        <rect x={x0 + 120} y={226} width={14} height={10} className="d-bar-access" />
        <text x={x0 + 140} y={235} className="d-faint">access token</text>
        <rect x={x0 + 240} y={226} width={14} height={10} className="d-bar-dead" opacity="0.4" />
        <text x={x0 + 260} y={235} className="d-faint">blacklisted / unusable</text>
      </svg>
    </Figure>
  );
}

/* 6. JWT structure ---------------------------------------------------- */
export function JwtStructureDiagram() {
  const seg = [
    { x: 20, w: 200, cls: 'accent', t: 'Header', lines: ['{', '  "alg": "HS256",', '  "typ": "JWT"', '}'] },
    { x: 250, w: 250, cls: 'brass', t: 'Payload (claims)', lines: ['{', '  "token_type": "access",', '  "exp": 1795275000,', '  "iat": 1795273200,', '  "jti": "9f2c…",', '  "user_id": "1"', '}'] },
    { x: 525, w: 205, cls: 'danger', t: 'Signature', lines: ['HMACSHA256(', '  base64url(header) + "." +', '  base64url(payload),', '  SECRET_KEY', ')'] },
  ];
  return (
    <Figure title="Anatomy of a Simple JWT access token"
      caption="A JWT is three base64url strings joined by dots. The header and payload are only encoded, not encrypted: anyone can read them. The signature is what makes them tamper-proof. Simple JWT signs with HS256 and Django’s SECRET_KEY by default.">
      <svg viewBox="0 0 740 250" width={740} role="img" aria-label="JWT structure">
        <title>JWT structure</title>
        <text x={20} y={22} className="d-mono">
          <tspan className="d-accent-text">eyJhbGciOiJIUzI1NiIs…</tspan>
          <tspan>.</tspan>
          <tspan className="d-brass-text">eyJ0b2tlbl90eXBlIjoiYWNjZXNz…</tspan>
          <tspan>.</tspan>
          <tspan className="d-danger-text">Kq3v8Zr0YbM1x…</tspan>
        </text>
        {seg.map((s) => (
          <g key={s.t}>
            <rect x={s.x} y={44} width={s.w} height={190} rx="4" className={`d-box ${s.cls}`} />
            <text x={s.x + 12} y={66} className="d-title">{s.t}</text>
            {s.lines.map((l, i) => (
              <text key={i} x={s.x + 12} y={90 + i * 17} className="d-mono" xmlSpace="preserve">{l}</text>
            ))}
          </g>
        ))}
      </svg>
    </Figure>
  );
}

/* 7. CRUD map ----------------------------------------------------------- */
export function CrudMapDiagram() {
  const ids = useMarkerIds();
  const rows = [
    ['POST', '/api/products/create/', 'create_product', 'ProductSerializer(data=…)', 'save() → INSERT', '201'],
    ['GET', '/api/products/', 'get_products', 'ProductSerializer(qs, many=True)', 'Product.objects.all()', '200'],
    ['GET', '/api/products/{id}/', 'get_product', 'ProductSerializer(product)', 'get_object_or_404()', '200'],
    ['PUT', '/api/products/{id}/update/', 'update_product', 'partial=False', 'save() → UPDATE', '200'],
    ['PATCH', '/api/products/{id}/update/', 'update_product', 'partial=True', 'save() → UPDATE', '200'],
    ['DELETE', '/api/products/{id}/delete/', 'delete_product', '(no serializer)', 'product.delete()', '200'],
  ];
  const colors = { GET: 'accent', POST: '', PUT: 'brass', PATCH: 'brass', DELETE: 'danger' };
  const cols = [20, 290, 450, 690, 870];
  const H = 48 + rows.length * 46;
  return (
    <Figure title="Product CRUD workflow"
      caption="Each endpoint maps to one function-based view. Every row passes JWT authentication and IsAuthenticated first; get_object_or_404 turns a missing id into 404 before the serializer runs.">
      <svg viewBox={`0 0 920 ${H}`} width={920} role="img" aria-label="CRUD map">
        <title>CRUD map</title>
        <Markers ids={ids} />
        {['Request', 'View function', 'Serializer', 'ORM operation', 'Status'].map((h, i) => (
          <text key={h} x={cols[i]} y={18} className="d-group-label">{h}</text>
        ))}
        {rows.map((r, i) => {
          const y = 34 + i * 46;
          return (
            <g key={i}>
              <rect x={cols[0]} y={y} width={250} height={34} rx="4" className={`d-box ${colors[r[0]]}`} />
              <text x={cols[0] + 10} y={y + 21} className="d-title" style={{ fontSize: 11 }}>{r[0]}</text>
              <text x={cols[0] + 62} y={y + 21} className="d-mono">{r[1]}</text>
              <line x1={cols[0] + 252} x2={cols[1] - 4} y1={y + 17} y2={y + 17} className="d-line" markerEnd={`url(#${ids.def})`} />
              <rect x={cols[1]} y={y} width={136} height={34} rx="4" className="d-box muted" />
              <text x={cols[1] + 10} y={y + 21} className="d-label">{r[2]}()</text>
              <line x1={cols[1] + 138} x2={cols[2] - 4} y1={y + 17} y2={y + 17} className="d-line" markerEnd={`url(#${ids.def})`} />
              <text x={cols[2]} y={y + 21} className="d-mono">{r[3]}</text>
              <text x={cols[3]} y={y + 21} className="d-mono">{r[4]}</text>
              <text x={cols[4]} y={y + 21} className="d-accent-text">{r[5]}</text>
            </g>
          );
        })}
      </svg>
    </Figure>
  );
}

/* 8. Update sequence (PUT vs PATCH) ------------------------------------ */
export function UpdateFlowDiagram() {
  return (
    <Figure title="One view, two update semantics"
      caption="update_product handles both methods. The only difference is the partial flag passed to the serializer, derived from request.method.">
      <Sequence title="Update flow" colW={176} actors={[
        { label: 'Client' },
        { label: 'update_product()', tone: 'brass' },
        { label: 'ProductSerializer' },
        { label: 'SQLite' },
      ]} steps={[
        { from: 0, to: 1, label: 'PUT|PATCH multipart' },
        { from: 1, to: 3, label: 'get_object_or_404(id=pk)' },
        { from: 3, to: 1, label: 'product', kind: 'res' },
        { from: 1, to: 1, label: 'partial = method=="PATCH"' },
        { from: 1, to: 2, label: '(product, data, partial)' },
        { from: 2, to: 2, label: 'is_valid()' },
        { note: 'PUT: every field required|PATCH: only sent fields', at: 2 },
        { from: 2, to: 3, label: 'save() → UPDATE' },
        { from: 1, to: 0, label: '200 {message, data}', kind: 'ok' },
      ]} />
    </Figure>
  );
}

/* 9. Image upload flow ------------------------------------------------- */
export function ImageUploadDiagram() {
  return (
    <Figure title="Image upload workflow"
      caption="From a multipart request to a stored file and a URL in the response. The file is written to disk only when serializer.save() runs, after every validation step has passed.">
      <Flow title="Image upload workflow" boxW={350} branchW={230} stages={[
        { title: 'Thunder Client → Body → Form', sub: ['name, description, price = text · image = file'], tone: 'muted' },
        { title: 'Content-Type: multipart/form-data', sub: ['boundary separates each part'], mono: true },
        { title: '@parser_classes([MultiPartParser, FormParser])', sub: 'request.data = QueryDict of fields + UploadedFile', tone: 'brass',
          branch: { label: 'JSON body', title: '415 Unsupported Media', sub: ['application/json'] } },
        { title: 'ImageField validation (Pillow)', sub: 'file present and a real, decodable image',
          branch: { label: 'not image', title: '400 image error', sub: ['"Upload a valid image…"'] } },
        { title: 'validate_image()', sub: '≤ 2 MB and extension in jpg / jpeg / png', tone: 'accent',
          branch: { label: 'too big', title: '400 image error', sub: ['size or extension message'] } },
        { title: 'serializer.save()', sub: ['file → MEDIA_ROOT/products/<name>', 'row stores "products/<name>"'], mono: true, tone: 'accent' },
        { title: 'Response', sub: ['"image": "/media/products/<name>"'], mono: true },
        { title: 'GET /media/products/<name>', sub: 'served by static() only while DEBUG = True', tone: 'muted' },
      ]} />
    </Figure>
  );
}

/* 10. Architecture ----------------------------------------------------- */
export function ArchitectureDiagram() {
  const ids = useMarkerIds();
  const Box = ({ x, y, w, h, t, s, tone = '' }) => (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="4" className={`d-box ${tone}`} />
      <text x={x + 12} y={y + 21} className="d-title">{t}</text>
      {(Array.isArray(s) ? s : [s]).filter(Boolean).map((l, i) => (
        <text key={i} x={x + 12} y={y + 38 + i * 14} className="d-mono">{l}</text>
      ))}
    </g>
  );
  const arrow = (x1, y1, x2, y2, cls = '') => (
    <line x1={x1} y1={y1} x2={x2} y2={y2} className={`d-line ${cls}`} markerEnd={`url(#${ids.def})`} />
  );
  return (
    <Figure title="Project architecture"
      caption="One Django project (config) with one app (products). DRF and Simple JWT are installed apps; Pillow is a library used by ImageField. Data lives in SQLite; uploaded files live on disk under media/.">
      <svg viewBox="0 0 780 560" width={780} role="img" aria-label="Project architecture">
        <title>Project architecture</title>
        <Markers ids={ids} />
        <text x={20} y={18} className="d-group-label">Clients</text>
        <Box x={20} y={28} w={230} h={54} t="Thunder Client" s="VS Code extension" tone="muted" />
        <Box x={270} y={28} w={230} h={54} t="Frontend app" s="any HTTP client (optional)" tone="muted" />
        {arrow(260, 84, 260, 124)}
        <text x={268} y={108} className="d-faint">HTTP · JSON or multipart · Bearer token</text>

        <rect x={14} y={128} width={752} height={318} rx="6" className="d-group" />
        <text x={26} y={146} className="d-group-label">Django project · backend/</text>

        <Box x={30} y={156} w={340} h={70} t="config/" s={['settings.py: REST_FRAMEWORK, SIMPLE_JWT, MEDIA', 'urls.py: admin/ · api/ → products · /media/']} tone="accent" />
        <Box x={390} y={156} w={360} h={70} t="Installed third-party apps" s={['rest_framework', 'rest_framework_simplejwt.token_blacklist']} tone="brass" />

        <rect x={30} y={240} width={720} height={194} rx="5" className="d-group" />
        <text x={42} y={258} className="d-group-label">App · products/</text>
        <Box x={42} y={268} w={160} h={66} t="urls.py" s={['10 routes under', '/api/']} />
        <Box x={222} y={268} w={160} h={66} t="views.py" s={['@api_view', 'functions']} tone="brass" />
        <Box x={402} y={268} w={160} h={66} t="serializers.py" s={['RegisterSerializer', 'ProductSerializer']} />
        <Box x={582} y={268} w={156} h={66} t="models.py" s={['Product', '(User from auth)']} />
        {arrow(202, 301, 220, 301)}
        {arrow(382, 301, 400, 301)}
        {arrow(562, 301, 580, 301)}
        <Box x={42} y={350} w={340} h={70} t="Simple JWT views" s={['TokenObtainPairView → /api/login/', 'TokenRefreshView → /api/token/refresh/']} tone="accent" />
        <Box x={402} y={350} w={336} h={70} t="Pillow" s={['validates uploaded images for', 'ImageField']} tone="muted" />

        <text x={20} y={470} className="d-group-label">Storage</text>
        {arrow(200, 446, 200, 488)}
        {arrow(580, 446, 580, 488)}
        <Box x={20} y={490} w={360} h={62} t="db.sqlite3" s={['auth_user · products_product', 'token_blacklist_* (2 tables)']} />
        <Box x={400} y={490} w={360} h={62} t="media/products/" s={['uploaded image files (MEDIA_ROOT)', 'served at /media/ while DEBUG = True']} />
      </svg>
    </Figure>
  );
}

/* 11. Frontend ↔ backend ---------------------------------------------- */
export function FrontendBackendDiagram() {
  return (
    <Figure title="Frontend-to-backend communication"
      caption="How a browser frontend would use this API. The backend side is implemented; the frontend and the CORS configuration it requires are not part of this project yet.">
      <Sequence title="Frontend to backend" colW={190} actors={[
        { label: 'User' },
        { label: 'Frontend', sub: 'e.g. React + fetch' },
        { label: 'DRF API', sub: 'http://127.0.0.1:8000', tone: 'accent' },
        { label: '/media/', sub: 'image files' },
      ]} steps={[
        { from: 0, to: 1, label: 'submit login form' },
        { from: 1, to: 2, label: 'POST /api/login/ (JSON)' },
        { from: 2, to: 1, label: '200 {refresh, access}', kind: 'ok' },
        { from: 1, to: 1, label: 'keep tokens' },
        { from: 1, to: 2, label: 'GET /api/products/ + Bearer' },
        { from: 2, to: 1, label: '200 {data: [...]}', kind: 'ok' },
        { from: 1, to: 3, label: '<img src=API + image>' },
        { from: 0, to: 1, label: 'add product form' },
        { from: 1, to: 2, label: 'POST create/ (FormData)' },
        { from: 2, to: 1, label: '201 {message, data}', kind: 'ok' },
        { from: 2, to: 1, label: '401 when access expires', kind: 'err' },
        { from: 1, to: 2, label: 'POST /api/token/refresh/' },
      ]} />
    </Figure>
  );
}

/* 12. Complete application workflow ----------------------------------- */
export function CompleteWorkflowDiagram() {
  return (
    <Figure title="Complete application workflow"
      caption="The full life of a client session against this API, in the order you would test it.">
      <Flow title="Complete workflow" boxW={360} branchW={220} stages={[
        { title: '1. Register', sub: ['POST /api/register/ → 201 user'], mono: true, tone: 'muted' },
        { title: '2. Log in', sub: ['POST /api/login/ → {refresh, access}'], mono: true, tone: 'accent',
          branch: { label: 'bad creds', title: '401', sub: ['No active account…'] } },
        { title: '3. Work with products', sub: ['create · list · retrieve · update · delete', 'Authorization: Bearer <access>'], mono: true, tone: 'brass',
          branch: { label: 'no token', title: '401', sub: ['credentials not provided'] } },
        { title: '4. Access token expires (30 min)', sub: ['protected calls return 401 token_not_valid'], mono: true },
        { title: '5. Refresh', sub: ['POST /api/token/refresh/ → {access}'], mono: true, tone: 'accent',
          branch: { label: 'refresh dead', title: 'Log in again', sub: ['expired or blacklisted'], tone: 'danger' } },
        { title: '6. Log out', sub: ['POST /api/logout/ → refresh blacklisted'], mono: true, tone: 'muted' },
      ]} />
    </Figure>
  );
}

/* 13. Django vs DRF ----------------------------------------------------- */
export function DjangoVsDrfDiagram() {
  return (
    <Figure title="Where DRF sits inside Django"
      caption="DRF does not replace Django. It adds a layer between URL routing and your code that handles content negotiation, parsing, authentication, permissions, and rendering.">
      <Flow title="Django vs DRF" boxW={300} branchW={270} stages={[
        { title: 'Django: URL routing', sub: 'path() in urls.py', tone: 'muted',
          branch: { label: 'plain Django', title: 'View returns HttpResponse', sub: ['you build HTML / JSON by hand'], tone: 'accent' } },
        { title: 'DRF: Request object', sub: 'request.data, request.user', tone: 'brass' },
        { title: 'DRF: auth + permissions', sub: 'JWTAuthentication, IsAuthenticated', tone: 'brass' },
        { title: 'Your view + serializer', sub: 'validation, model ↔ JSON' },
        { title: 'DRF: Response + renderer', sub: 'Response(data, status=…) → JSON', tone: 'brass' },
      ]} />
    </Figure>
  );
}
