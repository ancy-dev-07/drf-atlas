import { Callout, Code, H2, H3, L, Steps, Table, DefList, Compare } from '../../components/docs.jsx';
import { ImageUploadDiagram } from '../../diagrams/index.jsx';
import { CODE } from '../../lib/source.js';

const GROUP = 'Image Upload';

/* ------------------------------------------------------------------ */
function Fundamentals() {
  return (
    <>
      <ImageUploadDiagram />

      <H2>ImageField</H2>
      <p>The <code>Product</code> model declares its image like this:</p>
      <Code lang="python" file="backend/products/models.py (excerpt)">{`
image = models.ImageField(upload_to='products/')
`}</Code>
      <ul>
        <li><strong>Model level:</strong> <code>ImageField</code> is a <code>FileField</code> that stores a <em>path</em> (a string up to 100 characters) in the database, not the image bytes.</li>
        <li><strong><code>upload_to='products/'</code></strong> is a subfolder of <code>MEDIA_ROOT</code>. A file named <code>mouse.png</code> is saved as <code>backend/media/products/mouse.png</code>, and the column holds <code>products/mouse.png</code>.</li>
        <li><strong>Serializer level:</strong> <code>ModelSerializer</code> generates a DRF <code>serializers.ImageField</code>, which checks that a file was submitted, that it is not empty, and that Pillow can open it as an image.</li>
      </ul>

      <H2>Pillow</H2>
      <p>
        Pillow is the standard Python imaging library. Django needs it for <code>ImageField</code>: it opens the upload and verifies
        it is a real image in a format Pillow understands. Without Pillow installed, Django refuses to start:
      </p>
      <Code lang="text" file="System check error without Pillow">{`
products.Product.image: (fields.E210) Cannot use ImageField because Pillow is not installed.
        HINT: Get Pillow at https://pypi.org/project/Pillow/ or run command "python -m pip install Pillow".
`}</Code>
      <p>Installing it is all that is needed. No import appears in the project code:</p>
      <Code lang="bash">{`
pip install pillow
`}</Code>

      <H2>Multipart form data</H2>
      <p>
        JSON is text, so it cannot carry an image directly. <strong>multipart/form-data</strong> is the HTTP encoding designed for
        forms with files. The body is split into parts separated by a random <em>boundary</em> string; each part has its own
        headers and content, which may be binary.
      </p>
      <Code lang="http" file="What Thunder Client actually sends (simplified)">{`
POST /api/products/create/ HTTP/1.1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
Content-Type: multipart/form-data; boundary=----TCBoundary7MA4YWxk

------TCBoundary7MA4YWxk
Content-Disposition: form-data; name="name"

Wireless Mouse
------TCBoundary7MA4YWxk
Content-Disposition: form-data; name="price"

25.99
------TCBoundary7MA4YWxk
Content-Disposition: form-data; name="image"; filename="mouse.png"
Content-Type: image/png

<binary PNG bytes>
------TCBoundary7MA4YWxk--
`}</Code>
      <Callout type="warning" title="Never set the multipart Content-Type by hand">
        The <code>boundary</code> parameter must match the separators in the body. Thunder Client, curl <code>-F</code>, and a browser’s
        <code> FormData</code> all generate it automatically. If you add a <code>Content-Type: multipart/form-data</code> header
        manually without the boundary, the parser cannot split the body and returns 400.
      </Callout>
      <Compare
        left={{ title: 'application/json', body: <ul><li>Text only</li><li>Nested objects and arrays</li><li>Used by register, login, refresh, logout</li></ul> }}
        right={{ title: 'multipart/form-data', body: <ul><li>Text fields and binary files</li><li>Flat key/value parts</li><li>Required by create and update</li></ul> }}
      />

      <H2>MultiPartParser</H2>
      <p>A DRF <em>parser</em> turns a raw request body into <code>request.data</code>. Which parser runs depends on the request’s <code>Content-Type</code>.</p>
      <Code lang="python" file="backend/products/views.py (decorators of create_product and update_product)">{`
@parser_classes([MultiPartParser, FormParser])
`}</Code>
      <p>
        <code>MultiPartParser</code> handles <code>multipart/form-data</code>. It produces a <code>QueryDict</code> containing both the
        text fields and the uploaded files, so the serializer sees <code>request.data['image']</code> as an <code>UploadedFile</code>.
        Django keeps small uploads (up to 2.5 MB by default) in memory and streams larger ones to a temporary file.
      </p>

      <H2>FormParser</H2>
      <p>
        <code>FormParser</code> handles <code>application/x-www-form-urlencoded</code>, the encoding of simple HTML forms without files.
        It is listed so text-only updates (e.g. a PATCH that changes only <code>price</code>) also work when a client sends
        URL-encoded data. It cannot carry files.
      </p>
      <H3>Why JSON is rejected</H3>
      <p>
        <code>@parser_classes</code> <em>replaces</em> DRF’s default parser list (JSON, Form, MultiPart) for that view. Because
        <code> JSONParser</code> is not in the list, a JSON body has no matching parser:
      </p>
      <Code lang="json" file="415 Unsupported Media Type">{`
{
  "detail": "Unsupported media type \\"application/json\\" in request."
}
`}</Code>
      <Table head={['View', 'Parsers', 'Accepts']} rows={[
        [<code>create_product</code>, 'MultiPartParser, FormParser', 'multipart, url-encoded'],
        [<code>update_product</code>, 'MultiPartParser, FormParser', 'multipart, url-encoded'],
        ['All other views', 'DRF defaults', 'JSON, url-encoded, multipart'],
      ]} />
    </>
  );
}

/* ------------------------------------------------------------------ */
function MediaConfig() {
  return (
    <>
      <p>
        Django distinguishes <strong>static files</strong> (CSS, JS and images that ship with the code) from <strong>media files</strong>
        (files uploaded by users at runtime). Uploaded product images are media files.
      </p>

      <H2>MEDIA_URL</H2>
      <Code lang="python" file="backend/config/settings.py" code={CODE.media} mark={['MEDIA_URL']} />
      <p>
        The public URL prefix for media. <code>ImageField</code> builds the URL of a stored file by joining <code>MEDIA_URL</code> and
        the stored path: <code>/media/</code> + <code>products/mouse.png</code> = <code>/media/products/mouse.png</code>. That is the value
        returned in the API’s <code>image</code> field.
      </p>

      <H2>MEDIA_ROOT</H2>
      <p>
        The absolute filesystem directory where uploads are written: <code>BASE_DIR / 'media'</code>, i.e. <code>backend/media/</code>.
        Combined with <code>upload_to='products/'</code>, every product image ends up in <code>backend/media/products/</code>.
      </p>
      <Table head={['Concept', 'Value for one upload']} rows={[
        ['Uploaded file name', <code>mouse.png</code>],
        ['Saved on disk', <code>backend/media/products/mouse.png</code>],
        ['Stored in database', <code>products/mouse.png</code>],
        ['Returned by the API', <code>/media/products/mouse.png</code>],
        ['Opened in a browser', <code>http://127.0.0.1:8000/media/products/mouse.png</code>],
      ]} />
      <Callout type="note" title="Relative image URLs">
        DRF returns an absolute URL (<code>http://127.0.0.1:8000/media/…</code>) only when the serializer receives the request in
        its context. The views create serializers without <code>context</code>, so clients must prepend the server origin. To
        return absolute URLs, construct serializers as <code>ProductSerializer(product, context={'{'}'request': request{'}'})</code>.
      </Callout>

      <H2>Media file serving during development</H2>
      <Code lang="python" file="backend/config/urls.py" code={CODE.rootUrls} mark={['if settings.DEBUG', 'static(', 'settings.MEDIA_URL', 'document_root']} />
      <p>
        <code>django.conf.urls.static.static()</code> adds a URL pattern that maps <code>/media/&lt;path&gt;</code> to files in
        <code> MEDIA_ROOT</code> using Django’s development file server. It only works while <code>DEBUG = True</code>.
      </p>
      <ul>
        <li>Media URLs are <strong>not protected</strong> by JWT. This route is a plain Django view, not a DRF view, so anyone who knows a URL can open the image.</li>
        <li>In production (<code>DEBUG = False</code>) this route disappears and <code>/media/…</code> returns 404. A web server (Nginx, Caddy) or cloud storage must serve the files instead. See <L to="best-practices/improvements" s="cloud-media-storage">Cloud media storage</L>.</li>
      </ul>
    </>
  );
}

/* ------------------------------------------------------------------ */
function ThunderUpload() {
  return (
    <>
      <p>This walkthrough creates a product with an image. It assumes you already have an access token from <L to="testing/thunder-client-setup" s="setting-bearer-authentication">logging in</L>.</p>

      <H2>Uploading images through Thunder Client</H2>
      <Steps>
        <li><strong>New request</strong>Click <em>New Request</em>, choose <code>POST</code>, and enter <code>http://127.0.0.1:8000/api/products/create/</code>.</li>
        <li><strong>Authentication</strong>Open the <em>Auth</em> tab, choose <em>Bearer</em>, and paste the access token (without the word “Bearer”).</li>
        <li>
          <strong>Body → Form</strong>
          Open the <em>Body</em> tab and select <em>Form</em> (not JSON). Thunder Client sends this as <code>multipart/form-data</code> and generates the boundary.
        </li>
        <li>
          <strong>Add the text fields</strong>
          <Code lang="text">{`
name         Wireless Mouse
description  Ergonomic 2.4 GHz wireless mouse
price        25.99
`}</Code>
        </li>
        <li>
          <strong>Add the file field</strong>
          Enable <em>Files</em> in the form section (the “Files” checkbox or toggle), add a field named exactly <code>image</code>, and choose a <code>.png</code>, <code>.jpg</code> or <code>.jpeg</code> file under 2 MB.
        </li>
        <li><strong>Leave Content-Type alone</strong>Do not add a <code>Content-Type</code> header in the <em>Headers</em> tab.</li>
        <li><strong>Send</strong>Expect <code>201 Created</code> with the product under <code>data</code>.</li>
      </Steps>
      <Code lang="json" file="201 Created">{`
{
  "message": "Product created successfully",
  "data": {
    "id": 1,
    "name": "Wireless Mouse",
    "description": "Ergonomic 2.4 GHz wireless mouse",
    "price": "25.99",
    "image": "/media/products/mouse.png",
    "created_at": "2026-11-21T14:40:12.481203Z"
  }
}
`}</Code>

      <H2>Check the result</H2>
      <ul>
        <li>The file now exists at <code>backend/media/products/mouse.png</code>.</li>
        <li>Opening <code>http://127.0.0.1:8000/media/products/mouse.png</code> in a browser shows the image.</li>
        <li>The product appears in <code>GET /api/products/</code> and in the admin.</li>
      </ul>

      <H2>Updating the image</H2>
      <p>
        Use the same Form body with <code>PUT</code> (all four fields) or <code>PATCH</code> (only <code>image</code>) against
        <code> /api/products/{'{id}'}/update/</code>.
      </p>

      <H2>Common mistakes</H2>
      <Table head={['Symptom', 'Cause', 'Fix']} rows={[
        ['415 Unsupported media type "application/json"', 'Body tab set to JSON', 'Switch to Body → Form'],
        [<>400 <code>{'{"image": ["No file was submitted."]}'}</code></>, 'File field missing, misnamed (e.g. “Image”), or added as text', 'Key must be exactly image, with type File'],
        ['400 “Upload a valid image…”', 'The file is not an image or is corrupted', 'Choose a real PNG/JPEG'],
        ['400 “Only JPG, JPEG and PNG images are allowed”', '.gif, .webp, .bmp…', 'Convert to PNG or JPEG'],
        ['400 “Image size should not exceed 2 MB”', 'File larger than 2,097,152 bytes', 'Compress or resize'],
        ['401 credentials not provided', 'Auth tab empty or wrong type', 'Auth → Bearer with the access token'],
      ]} />
    </>
  );
}

/* ------------------------------------------------------------------ */
function ValidationAndReplacement() {
  return (
    <>
      <p>Image validation happens in two layers. The first comes with DRF; the second is the project’s own <code>validate_image</code> method.</p>
      <Code lang="python" file="backend/products/serializers.py" code={CODE.productSerializer} lines mark={['value.size', 'allowed_extensions', 'extension =']} />

      <H2>Validation order</H2>
      <ol>
        <li><strong>DRF <code>ImageField</code></strong>: a file was submitted, it has a name, it is not empty, and Pillow can open it. Failure: <code>"No file was submitted."</code>, <code>"The submitted file is empty."</code> or <code>"Upload a valid image. …"</code></li>
        <li><strong><code>validate_image</code> size check</strong>: rejects more than 2 MB.</li>
        <li><strong><code>validate_image</code> extension check</strong>: rejects anything other than jpg, jpeg, png.</li>
      </ol>
      <p>Because step 1 runs first, a text file renamed to <code>fake.png</code> fails with the Pillow message, not the extension message.</p>

      <H2>Image size validation</H2>
      <Code lang="python">{`
if value.size > 2 * 1024 * 1024:
    raise serializers.ValidationError(
        "Image size should not exceed 2 MB"
    )
`}</Code>
      <DefList items={[
        ['value', 'The UploadedFile from request.data["image"].'],
        ['value.size', 'Size in bytes, known after parsing.'],
        ['2 * 1024 * 1024', '2,097,152 bytes (2 MiB). The comparison is strictly greater than, so exactly 2 MiB is allowed.'],
      ]} />
      <Callout type="note">
        This check runs after Django has received the whole upload. It stops large files from being <em>saved</em>, not from being
        <em> sent</em>. To cap request size at the server level, configure <code>DATA_UPLOAD_MAX_MEMORY_SIZE</code>, Django’s file upload
        settings, or the reverse proxy in production.
      </Callout>

      <H2>Allowed extensions</H2>
      <Code lang="python">{`
allowed_extensions = ['jpg', 'jpeg', 'png']

extension = value.name.split('.')[-1].lower()

if extension not in allowed_extensions:
    raise serializers.ValidationError(
        "Only JPG, JPEG and PNG images are allowed"
    )
`}</Code>
      <ul>
        <li><code>value.name.split('.')[-1]</code> takes the text after the last dot: <code>holiday.photo.PNG</code> → <code>PNG</code>.</li>
        <li><code>.lower()</code> makes the comparison case-insensitive.</li>
        <li>A file without any dot, such as <code>image</code>, yields the whole name as the “extension” and is rejected.</li>
      </ul>
      <Callout type="tip" title="Extension vs real format">
        The extension is just part of the filename. Pillow’s check (layer 1) guarantees the content is an image, but not that a
        <code> .png</code> file really contains PNG data. For stricter control, open the file with Pillow and check
        <code> Image.open(value).format in ('PNG', 'JPEG')</code>.
      </Callout>

      <H2>Replacing existing images</H2>
      <p>When PUT or PATCH uploads a new image, <code>serializer.save()</code> stores the new file and updates the path in the database. Two behaviours are worth knowing:</p>
      <H3>The old file is not deleted</H3>
      <p>
        Django never deletes files automatically, neither on update nor on <code>product.delete()</code>. This protects against data loss
        (for example inside a transaction that rolls back), but orphaned files accumulate in <code>media/products/</code>.
      </p>
      <H3>Name collisions get a random suffix</H3>
      <p>
        If <code>media/products/mouse.png</code> already exists, Django’s storage does not overwrite it. It appends an underscore and seven
        random characters: <code>mouse_lRVGu4E.png</code>. You can see this in the project’s own media folder, which contains
        <code> image_29.png</code>, <code>image_29_FFjwQ6e.png</code> and <code>image_29_lmLQDs7.png</code>: the same file uploaded three times.
      </p>
      <Callout type="future" title="Cleaning up replaced files">
        One option is to delete the previous file in the update view when a new image is sent:
        <Code lang="python" file="Suggested change — not in the project">{`
old_image = product.image
if serializer.is_valid():
    new_file_sent = 'image' in request.FILES
    serializer.save()
    if new_file_sent and old_image and old_image.name != product.image.name:
        old_image.storage.delete(old_image.name)
`}</Code>
        Packages such as <code>django-cleanup</code> automate this for every FileField.
      </Callout>
    </>
  );
}

export default [
  { slug: 'image-upload/fundamentals', group: GROUP, title: 'ImageField, Pillow and Multipart Parsing', nav: 'ImageField, Pillow & parsers', Body: Fundamentals,
    lede: 'How an image travels from a multipart request through DRF’s parsers and fields into storage.' },
  { slug: 'image-upload/media-configuration', group: GROUP, title: 'Media Configuration', nav: 'MEDIA_URL, MEDIA_ROOT & serving', Body: MediaConfig,
    lede: 'Where uploaded files are stored, how their URLs are built, and how they are served during development.' },
  { slug: 'image-upload/thunder-client-upload', group: GROUP, title: 'Uploading Images Through Thunder Client', nav: 'Uploading with Thunder Client', Body: ThunderUpload,
    lede: 'Step-by-step: send a multipart request with a file and verify the stored image.' },
  { slug: 'image-upload/validation-and-replacement', group: GROUP, title: 'Image Validation and Replacement', nav: 'Validation & replacement', Body: ValidationAndReplacement,
    lede: 'The size and extension rules, the order validation runs in, and what happens to old files when an image is replaced.' },
];
