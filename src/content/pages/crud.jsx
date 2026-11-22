import { Callout, Code, EndpointBar, H2, H3, L, Table, DefList, Tabs, Status, BodyKind } from '../../components/docs.jsx';
import { CrudMapDiagram, UpdateFlowDiagram } from '../../diagrams/index.jsx';
import { CODE } from '../../lib/source.js';
import { SAMPLE_PRODUCT } from '../endpoints.jsx';

const GROUP = 'Product CRUD';

/* ------------------------------------------------------------------ */
function Create() {
  return (
    <>
      <H2>The CRUD map</H2>
      <p>
        CRUD stands for Create, Read, Update, Delete: the four basic operations on stored data. Each maps to an HTTP method
        and, in this project, to one function-based view:
      </p>
      <CrudMapDiagram />

      <H2>Create product</H2>
      <EndpointBar method="POST" path="/api/products/create/" auth />
      <p>
        Creating a product means accepting text fields <em>and</em> an image file in one request, so the body must be
        <BodyKind kind="multipart" />, not JSON.
      </p>
      <Code lang="python" file="backend/products/views.py" code={CODE.createProduct} lines mark={['@parser_classes', 'ProductSerializer(data=request.data)', 'serializer.save()']} />
      <H3>How it works</H3>
      <DefList items={[
        ["@api_view(['POST'])", 'Only POST is accepted; anything else returns 405.'],
        ['@permission_classes([IsAuthenticated])', 'A valid access token is required.'],
        ['@parser_classes([MultiPartParser, FormParser])', 'request.data can only be built from multipart/form-data or application/x-www-form-urlencoded. A JSON body triggers 415.'],
        ['ProductSerializer(data=request.data)', 'Create mode. request.data is a QueryDict holding name, description, price and the uploaded file under image.'],
        ['serializer.is_valid()', 'Runs field validation (including Pillow’s image check) and validate_image().'],
        ['serializer.save()', 'Calls ModelSerializer.create() → Product.objects.create(...). Saving the ImageField writes the file to MEDIA_ROOT/products/.'],
        ['HTTP_201_CREATED', 'The new product is returned under "data".'],
      ]} />
      <Tabs items={[
        { label: 'Form fields', content: (
          <Code lang="text" file="Thunder Client · Body → Form (multipart)">{`
name         Wireless Mouse
description  Ergonomic 2.4 GHz wireless mouse
price        25.99
image        [file] mouse.png
`}</Code>
        ) },
        { label: 'curl', content: (
          <Code lang="bash">{`
curl -X POST http://127.0.0.1:8000/api/products/create/ \\
  -H "Authorization: Bearer <access_token>" \\
  -F "name=Wireless Mouse" \\
  -F "description=Ergonomic 2.4 GHz wireless mouse" \\
  -F "price=25.99" \\
  -F "image=@mouse.png"
`}</Code>
        ) },
        { label: 'JavaScript', content: (
          <Code lang="javascript">{`
const form = new FormData();
form.append('name', 'Wireless Mouse');
form.append('description', 'Ergonomic 2.4 GHz wireless mouse');
form.append('price', '25.99');
form.append('image', fileInput.files[0]);

const res = await fetch('http://127.0.0.1:8000/api/products/create/', {
  method: 'POST',
  headers: { Authorization: \`Bearer \${access}\` }, // no Content-Type: the browser sets the boundary
  body: form,
});
`}</Code>
        ) },
      ]} />
      <Code lang="json" file="201 Created">{`
{
  "message": "Product created successfully",
  "data": ${SAMPLE_PRODUCT.replace(/\n/g, '\n  ')}
}
`}</Code>
      <p>Validation failures return 400 with one key per failing field. Full error list: <L to="api/products-create">POST /api/products/create/</L>.</p>
    </>
  );
}

/* ------------------------------------------------------------------ */
function Read() {
  return (
    <>
      <H2>Retrieve all products</H2>
      <EndpointBar method="GET" path="/api/products/" auth />
      <Code lang="python" file="backend/products/views.py" code={CODE.getProducts} lines mark={['many=True']} />
      <DefList items={[
        ['Product.objects.all()', 'A lazy QuerySet for every product. The SQL query runs when the serializer iterates it.'],
        ['many=True', 'Tells the serializer to expect an iterable and to return a list, serializing each item with ProductSerializer.'],
        ['HTTP_200_OK', 'Always 200 for an authenticated request, including when the list is empty.'],
      ]} />
      <Code lang="json" file="200 OK">{`
{
  "message": "Products retrieved successfully",
  "data": [
    ${SAMPLE_PRODUCT.replace(/\n/g, '\n    ')}
  ]
}
`}</Code>
      <Code lang="json" file="200 OK · no products yet">{`
{
  "message": "Products retrieved successfully",
  "data": []
}
`}</Code>
      <Callout type="future" title="Large catalogues">
        Every row is returned in one response, with no defined order. For more than a few hundred products, add ordering and
        pagination. See <L to="best-practices/improvements" s="pagination">Pagination</L>.
      </Callout>

      <H2>Retrieve a single product</H2>
      <EndpointBar method="GET" path="/api/products/{id}/" auth />
      <Code lang="python" file="backend/products/views.py" code={CODE.getProduct} lines mark={['get_object_or_404']} />
      <DefList items={[
        ['pk', 'The integer captured by <int:pk> in urls.py.'],
        ['get_object_or_404(Product, id=pk)', 'Runs Product.objects.get(id=pk). If no row matches, raises Http404, which DRF renders as a JSON 404.'],
        ['ProductSerializer(product)', 'Read mode for one instance. data is an object, not a list.'],
      ]} />
      <Code lang="json" file="200 OK">{`
{
  "message": "Product retrieved successfully",
  "data": ${SAMPLE_PRODUCT.replace(/\n/g, '\n  ')}
}
`}</Code>
      <Code lang="json" file="404 Not Found · GET /api/products/999/">{`
{
  "detail": "No Product matches the given query."
}
`}</Code>
      <Callout type="note">
        The 404 body comes from DRF’s exception handler, which in DRF 3.15+ keeps Django’s message (“No Product matches the
        given query.”). Older DRF versions returned <code>{'{"detail": "Not found."}'}</code>.
      </Callout>
    </>
  );
}

/* ------------------------------------------------------------------ */
function Update() {
  return (
    <>
      <H2>One view for PUT and PATCH</H2>
      <EndpointBar method={['PUT', 'PATCH']} path="/api/products/{id}/update/" auth />
      <p>
        Both update methods are handled by a single function. The serializer does the heavy lifting; the view only decides
        whether the update is partial.
      </p>
      <Code lang="python" file="backend/products/views.py" code={CODE.updateProduct} lines mark={["partial = request.method == 'PATCH'", 'partial=partial']} />
      <DefList items={[
        ["@api_view(['PUT', 'PATCH'])", 'Both methods reach the same function.'],
        ['@parser_classes([MultiPartParser, FormParser])', 'Both methods must send form data, so a new image can be included. JSON is rejected with 415.'],
        ['get_object_or_404(Product, id=pk)', 'Loads the existing product, or returns 404 before any validation.'],
        ["partial = request.method == 'PATCH'", 'True for PATCH, False for PUT.'],
        ['ProductSerializer(product, data=…, partial=partial)', 'Update mode: instance and data. save() will call update() instead of create().'],
      ]} />
      <UpdateFlowDiagram />

      <H2>Update using PUT</H2>
      <p>
        <strong>PUT replaces the resource.</strong> The client sends a complete new representation, so every writable field is
        required: <code>name</code>, <code>description</code>, <code>price</code> and <code>image</code>.
      </p>
      <Code lang="text" file="PUT /api/products/1/update/ · Body → Form">{`
name         Wireless Mouse Pro
description  Silent clicks, USB-C charging
price        29.99
image        [file] mouse-pro.png
`}</Code>
      <Code lang="json" file="400 Bad Request · PUT without an image">{`
{
  "image": [
    "No file was submitted."
  ]
}
`}</Code>
      <Callout type="warning" title="PUT always needs a file">
        The model’s <code>image</code> field is required, so a PUT must upload an image even if it hasn’t changed. To change only
        text fields, use PATCH.
      </Callout>

      <H2>Update using PATCH</H2>
      <p>
        <strong>PATCH modifies part of the resource.</strong> With <code>partial=True</code>, missing fields are skipped instead of
        reported as required. Fields that <em>are</em> sent are fully validated.
      </p>
      <Code lang="text" file="PATCH /api/products/1/update/ · Body → Form">{`
price        19.99
`}</Code>
      <Code lang="json" file="200 OK">{`
{
  "message": "Product updated successfully",
  "data": {
    "id": 1,
    "name": "Wireless Mouse",
    "description": "Ergonomic 2.4 GHz wireless mouse",
    "price": "19.99",
    "image": "/media/products/mouse.png",
    "created_at": "2026-11-21T14:40:12.481203Z"
  }
}
`}</Code>

      <H2>PUT vs PATCH</H2>
      <Table head={['', 'PUT', 'PATCH']} rows={[
        ['Semantics', 'Replace the whole product', 'Change some fields'],
        ['partial', <code>False</code>, <code>True</code>],
        ['Fields required', 'name, description, price, image', 'None; send only what changes'],
        ['Missing field', '400 “This field is required.”', 'Left unchanged'],
        ['Image', 'Must upload a file', 'Upload only to replace it'],
        ['Body format', <BodyKind kind="multipart" />, <BodyKind kind="multipart" />],
        ['Success', <Status code={200} />, <Status code={200} />],
      ]} />
      <p>In both cases <code>id</code> and <code>created_at</code> are read-only and cannot change, even if you send them.</p>
      <Callout type="note" title="Replaced images stay on disk">
        Uploading a new image updates the database path but does not delete the previous file from <code>media/products/</code>.
        See <L to="image-upload/validation-and-replacement" s="replacing-existing-images">Replacing existing images</L>.
      </Callout>
    </>
  );
}

/* ------------------------------------------------------------------ */
function Delete() {
  return (
    <>
      <H2>Delete product</H2>
      <EndpointBar method="DELETE" path="/api/products/{id}/delete/" auth />
      <Code lang="python" file="backend/products/views.py" code={CODE.deleteProduct} lines mark={['product.delete()']} />
      <DefList items={[
        ['get_object_or_404', 'Ensures the product exists; 404 otherwise.'],
        ['product.delete()', 'Issues a DELETE SQL statement for that row.'],
        ['HTTP_200_OK + message', 'A deliberate choice: many APIs return 204 No Content with an empty body, but a message is friendlier for testing and UIs.'],
      ]} />
      <p>No request body or serializer is needed: the URL identifies the product.</p>
      <Code lang="json" file="200 OK">{`
{
  "message": "Product deleted successfully"
}
`}</Code>
      <Code lang="json" file="404 Not Found · deleting the same id again">{`
{
  "detail": "No Product matches the given query."
}
`}</Code>
      <Callout type="warning" title="Deletion is permanent">
        There is no soft-delete or undo. The image file stays in <code>media/products/</code>; Django does not delete files when a
        model instance is deleted.
      </Callout>
    </>
  );
}

/* ------------------------------------------------------------------ */
function ResponsesAndErrors() {
  return (
    <>
      <H2>Response formats</H2>
      <p>The views use a consistent <strong>success envelope</strong>: a human-readable <code>message</code> plus the payload under <code>data</code>.</p>
      <Table head={['Endpoint', 'Status', 'Body shape']} rows={[
        ['Create', <Status code={201} />, <code>{'{"message", "data": {product}}'}</code>],
        ['List', <Status code={200} />, <code>{'{"message", "data": [products]}'}</code>],
        ['Retrieve', <Status code={200} />, <code>{'{"message", "data": {product}}'}</code>],
        ['Update (PUT/PATCH)', <Status code={200} />, <code>{'{"message", "data": {product}}'}</code>],
        ['Delete', <Status code={200} />, <code>{'{"message"}'}</code>],
        ['Register', <Status code={201} />, <code>{'{"message", "user": {user}}'}</code>],
        ['Logout', <Status code={205} />, <code>{'{"message"}'}</code>],
        ['Login (Simple JWT)', <Status code={200} />, <code>{'{"refresh", "access"}'}</code>],
        ['Refresh (Simple JWT)', <Status code={200} />, <code>{'{"access"}'}</code>],
      ]} />
      <p>Note that register uses <code>"user"</code> rather than <code>"data"</code>, and the two Simple JWT views return their own shape without a message.</p>

      <H2>Error handling</H2>
      <p>Errors come from three sources, and each produces a different shape. Clients should handle all three:</p>
      <H3>1. Serializer validation errors (400)</H3>
      <p>Returned explicitly by the views as <code>serializer.errors</code>: an object mapping field names to lists of messages.</p>
      <Code lang="json">{`
{
  "price": [
    "Ensure that there are no more than 2 decimal places."
  ],
  "image": [
    "Only JPG, JPEG and PNG images are allowed"
  ]
}
`}</Code>
      <H3>2. DRF exceptions (401, 404, 405, 415)</H3>
      <p>Raised by DRF or by <code>get_object_or_404</code>, converted by DRF’s exception handler into <code>{'{"detail": "…"}'}</code>. Simple JWT adds a <code>code</code>, and sometimes <code>messages</code>.</p>
      <Code lang="json">{`
{
  "detail": "Unsupported media type \\"application/json\\" in request."
}
`}</Code>
      <H3>3. Hand-written errors in logout (400)</H3>
      <p>The logout view builds its own error bodies with an <code>"error"</code> key:</p>
      <Code lang="json">{`
{
  "error": "Invalid or already blacklisted refresh token"
}
`}</Code>
      <H3>Unhandled exceptions (500)</H3>
      <p>
        Anything not caught (for example the <code>KeyError</code> when registering without an email) becomes a 500. With
        <code> DEBUG = True</code> the response is Django’s HTML debug page, not JSON. Read the traceback in the terminal running
        <code> runserver</code>.
      </p>
      <Table head={['Shape', 'Key to read', 'Produced by']} rows={[
        ['Field errors', 'each field name', <code>serializer.errors</code>],
        ['Detail', <code>detail</code>, 'DRF / Simple JWT exceptions'],
        ['Error', <code>error</code>, <><code>logout</code> view</>],
      ]} />
      <Callout type="future" title="Uniform errors">
        A custom <code>EXCEPTION_HANDLER</code> in <code>REST_FRAMEWORK</code> could wrap every error in one shape, e.g.
        <code> {'{"message": …, "errors": …}'}</code>, matching the success envelope. This is not implemented.
      </Callout>
    </>
  );
}

export default [
  { slug: 'crud/create', group: GROUP, title: 'Create Product', Body: Create,
    lede: 'The CRUD map, and the view that creates a product with an image from a multipart request.' },
  { slug: 'crud/read', group: GROUP, title: 'Retrieve Products', nav: 'Retrieve all & single', Body: Read,
    lede: 'Listing every product and fetching one by id, with many=True and get_object_or_404.' },
  { slug: 'crud/update', group: GROUP, title: 'Update Using PUT and PATCH', nav: 'Update (PUT & PATCH)', Body: Update,
    lede: 'How one function-based view supports full replacement and partial updates through the serializer’s partial flag.' },
  { slug: 'crud/delete', group: GROUP, title: 'Delete Product', Body: Delete,
    lede: 'Removing a product by id and what remains afterwards.' },
  { slug: 'crud/responses-and-errors', group: GROUP, title: 'Response Formats and Error Handling', nav: 'Responses & errors', Body: ResponsesAndErrors,
    lede: 'The success envelope used by every view, and the three error shapes a client must understand.' },
];
