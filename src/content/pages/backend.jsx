import { Callout, Code, H2, H3, L, Steps, Table, DefList, Method } from '../../components/docs.jsx';
import { CODE } from '../../lib/source.js';

const GROUP = 'Building the Backend';

/* ------------------------------------------------------------------ */
function ProjectAndApp() {
  return (
    <>
      <p>
        This page recreates the project skeleton from an empty folder. If you cloned the finished project, read it to
        understand where each piece came from. Run every command inside an activated virtual environment
        (see <L to="getting-started/installation">Installation</L>).
      </p>

      <H2>Installing packages</H2>
      <p>Four packages make up the whole backend:</p>
      <Code lang="bash">{`
pip install django djangorestframework djangorestframework-simplejwt pillow
`}</Code>
      <Table head={['Package', 'Import name', 'Why it is needed']} rows={[
        [<code>django</code>, <code>django</code>, 'The web framework itself.'],
        [<code>djangorestframework</code>, <code>rest_framework</code>, 'API views, serializers, parsers, permissions.'],
        [<code>djangorestframework-simplejwt</code>, <code>rest_framework_simplejwt</code>, 'JWT authentication, login/refresh views, token blacklist.'],
        [<code>pillow</code>, <code>PIL</code>, 'Required by ImageField. Without it, Django’s system check fails with fields.E210.'],
      ]} />
      <Callout type="note">The PyPI name and the import name differ for three of the four packages. You install <code>djangorestframework</code> but write <code>'rest_framework'</code> in <code>INSTALLED_APPS</code>.</Callout>

      <H2>Creating the Django project</H2>
      <p>
        A Django <em>project</em> is the configuration container: settings, the root URLconf, and the WSGI/ASGI entry points. This
        project’s package is called <code>config</code> and lives inside a <code>backend/</code> folder:
      </p>
      <Code lang="bash">{`
mkdir backend
cd backend
django-admin startproject config .
`}</Code>
      <p>
        The trailing <code>.</code> tells Django to put <code>manage.py</code> in the current folder (<code>backend/</code>) instead of
        creating another nested directory. You get <code>backend/manage.py</code> and <code>backend/config/</code> containing
        <code> settings.py</code>, <code>urls.py</code>, <code>asgi.py</code> and <code>wsgi.py</code>.
      </p>
      <Callout type="tip" title="Why the name config?">
        Naming the project package <code>config</code> makes its role obvious: it holds configuration, not features. Features live in
        apps. You will see this convention in many Django codebases.
      </Callout>

      <H2>Creating the Django app</H2>
      <p>An <em>app</em> is a self-contained feature module with its own models, views and URLs. Create the products app:</p>
      <Code lang="bash" file="backend/">{`
python manage.py startapp products
`}</Code>
      <p>
        This generates <code>products/</code> with <code>models.py</code>, <code>views.py</code>, <code>admin.py</code>, <code>apps.py</code>,
        <code> tests.py</code> and a <code>migrations/</code> package. Two files are added by hand: <code>serializers.py</code> and
        <code> urls.py</code>.
      </p>
      <Code lang="python" file="backend/products/apps.py">{`
from django.apps import AppConfig


class ProductsConfig(AppConfig):
    name = 'products'
`}</Code>

      <H2>Next steps</H2>
      <Steps>
        <li><strong>Register the apps and configure DRF</strong><L to="backend/settings">Configuring settings</L></li>
        <li><strong>Define the data</strong><L to="backend/product-model">Product model and migrations</L></li>
        <li><strong>Validate and convert data</strong><L to="backend/serializers">Serializers</L></li>
        <li><strong>Handle requests</strong><L to="backend/views">Function-based views</L></li>
        <li><strong>Expose URLs</strong><L to="backend/urls">URL routing</L></li>
      </Steps>
    </>
  );
}

/* ------------------------------------------------------------------ */
function Settings() {
  return (
    <>
      <p>All configuration lives in <code>backend/config/settings.py</code>. This page covers every setting the API depends on.</p>

      <H2>INSTALLED_APPS</H2>
      <Code lang="python" file="backend/config/settings.py" code={CODE.installedApps}
        mark={["'rest_framework'", "'products'", 'token_blacklist']} />
      <DefList items={[
        ['rest_framework', 'Activates DRF: its settings, renderers, and templates such as the browsable API.'],
        ['products', 'The project’s own app. Django discovers its models, migrations and admin registration.'],
        ['…token_blacklist', 'Simple JWT’s blacklist app. Adds two tables (OutstandingToken, BlacklistedToken) and makes refresh tokens blacklistable. Logout depends on it.'],
      ]} />
      <p>
        Simple JWT’s main package does not need its own <code>INSTALLED_APPS</code> entry for authentication to work. Only the
        blacklist sub-app does, because it has models and migrations.
      </p>
      <Callout type="note">The odd indentation of the blacklist line in the source is cosmetic. Python only cares that it is a string inside the list.</Callout>

      <H2>REST_FRAMEWORK and SIMPLE_JWT</H2>
      <Code lang="python" file="backend/config/settings.py" code={CODE.restAndJwt} lines />
      <H3>DEFAULT_AUTHENTICATION_CLASSES</H3>
      <p>
        Every DRF view uses <code>JWTAuthentication</code> to identify the user. It looks for an
        <code> Authorization: Bearer &lt;token&gt;</code> header, verifies the token’s signature and expiry, and loads the user whose id
        is in the token’s <code>user_id</code> claim. With no header it returns nothing, and the request continues as anonymous.
      </p>
      <H3>DEFAULT_PERMISSION_CLASSES</H3>
      <p>
        Added through <code>REST_FRAMEWORK.update(...)</code>, which is equivalent to writing the key inside the original dictionary.
        <code> IsAuthenticated</code> becomes the default for every view, so the API is <strong>secure by default</strong>: a new view is
        protected unless it explicitly opts out, as <code>register</code> does with <code>AllowAny</code>.
      </p>
      <H3>SIMPLE_JWT</H3>
      <Table head={['Setting', 'Value', 'Meaning']} rows={[
        [<code>ACCESS_TOKEN_LIFETIME</code>, <code>timedelta(minutes=30)</code>, 'Access tokens expire 30 minutes after they are issued (Simple JWT default: 5 minutes).'],
        [<code>REFRESH_TOKEN_LIFETIME</code>, <code>timedelta(days=1)</code>, 'Refresh tokens expire 24 hours after login.'],
      ]} />
      <p>
        Everything else uses Simple JWT defaults: algorithm <code>HS256</code>, signing key <code>SECRET_KEY</code>, header type
        <code> Bearer</code>, <code>ROTATE_REFRESH_TOKENS = False</code>, <code>BLACKLIST_AFTER_ROTATION = False</code>.
      </p>

      <H2>MEDIA_URL and MEDIA_ROOT</H2>
      <Code lang="python" file="backend/config/settings.py" code={CODE.media} />
      <DefList items={[
        ['MEDIA_URL', 'The URL prefix for uploaded files. A file stored as products/mouse.png is served at /media/products/mouse.png.'],
        ['MEDIA_ROOT', 'The folder on disk where uploads are saved: backend/media/. ImageField(upload_to="products/") adds the products/ subfolder.'],
      ]} />
      <p>Details in <L to="image-upload/media-configuration">Media configuration</L>.</p>

      <H2>Database</H2>
      <Code lang="python" file="backend/config/settings.py" code={CODE.databases} />
      <p>
        SQLite stores the entire database in one file, <code>backend/db.sqlite3</code>. It needs no server, which makes it ideal
        for development and learning. Switching to PostgreSQL later only changes this dictionary; models and views stay the same.
      </p>

      <H2>Other settings to know</H2>
      <Table head={['Setting', 'Current value', 'Note']} rows={[
        [<code>DEBUG</code>, <code>True</code>, 'Detailed error pages and media serving. Must be False in production.'],
        [<code>SECRET_KEY</code>, 'hard-coded “django-insecure-…”', 'Also signs every JWT. Move it to an environment variable before deploying.'],
        [<code>ALLOWED_HOSTS</code>, <code>[]</code>, 'With DEBUG on, Django allows localhost names automatically.'],
        [<code>AUTH_PASSWORD_VALIDATORS</code>, '4 default validators', <>Used by <code>createsuperuser</code> and admin forms. <strong>Not</strong> applied by <code>RegisterSerializer</code>.</>],
        [<><code>USE_TZ</code> / <code>TIME_ZONE</code></>,<><code>True</code> / <code>'UTC'</code></>, 'Timestamps are stored and returned in UTC.'],
      ]} />
    </>
  );
}

/* ------------------------------------------------------------------ */
function ProductModel() {
  return (
    <>
      <H2>Creating the Product model</H2>
      <p>A model is a Python class that describes a database table. Each attribute is a column. This is the only custom model in the project:</p>
      <Code lang="python" file="backend/products/models.py" code={CODE.model} lines />
      <Table head={['Field', 'Type', 'Database column', 'API behaviour']} rows={[
        [<code>id</code>, 'BigAutoField (implicit)', 'auto-increment primary key', 'Read-only; used in URLs as {id}'],
        [<code>name</code>, <code>CharField(max_length=100)</code>, 'varchar(100)', 'Required; max 100 characters'],
        [<code>description</code>, <code>TextField()</code>, 'text', 'Required; unlimited length'],
        [<code>price</code>, <code>DecimalField(max_digits=10, decimal_places=2)</code>, 'decimal', 'Required; up to 99,999,999.99; returned as a string'],
        [<code>image</code>, <code>ImageField(upload_to='products/')</code>, 'varchar(100) holding the file path', 'Required file upload'],
        [<code>created_at</code>, <code>DateTimeField(auto_now_add=True)</code>, 'datetime', 'Read-only; set once on creation'],
      ]} />
      <H3>Why these field types</H3>
      <ul>
        <li><strong><code>DecimalField</code> for money.</strong> Floats cannot represent values such as 0.1 exactly. Decimals store exact base-10 values, which is what prices need.</li>
        <li><strong><code>ImageField</code> stores a path, not bytes.</strong> The file goes to disk under <code>MEDIA_ROOT/products/</code>; the column holds a string such as <code>products/mouse.png</code>. ImageField extends FileField and uses Pillow to check that the upload is a real image.</li>
        <li><strong><code>auto_now_add=True</code></strong> fills the timestamp when the row is first saved and makes the field non-editable, so the serializer treats it as read-only.</li>
        <li><strong><code>__str__</code></strong> returns the product name, so the admin and the shell show “Wireless Mouse” instead of “Product object (1)”.</li>
      </ul>
      <Callout type="note">
        No field sets <code>blank=True</code> or <code>null=True</code>, so every writable field is required by the serializer. In
        particular, a product cannot exist without an image.
      </Callout>

      <H2>Database migrations</H2>
      <p>
        Migrations are versioned Python files that describe schema changes. Django compares your models with the existing
        migrations and generates new ones when they differ. Creating the table takes two commands:
      </p>
      <Code lang="bash" file="backend/">{`
python manage.py makemigrations
python manage.py migrate
`}</Code>
      <Code lang="text" file="makemigrations output">{`
Migrations for 'products':
  products\\migrations\\0001_initial.py
    + Create model Product
`}</Code>
      <p>The generated migration mirrors the model, plus the implicit <code>id</code> column:</p>
      <Code lang="python" file="backend/products/migrations/0001_initial.py" code={CODE.migration} />
      <p>
        <code>migrate</code> then applies every unapplied migration from every installed app: Django’s own (<code>auth</code>,
        <code> admin</code>, <code>sessions</code>, <code>contenttypes</code>), <code>products</code>, and <code>token_blacklist</code>.
      </p>
      <Code lang="text" file="migrate output (abridged)">{`
Operations to perform:
  Apply all migrations: admin, auth, contenttypes, products, sessions, token_blacklist
Running migrations:
  Applying contenttypes.0001_initial... OK
  Applying auth.0001_initial... OK
  ...
  Applying products.0001_initial... OK
  Applying sessions.0001_initial... OK
  Applying token_blacklist.0001_initial... OK
  ...
  Applying token_blacklist.0013_alter_blacklistedtoken_options_and_more... OK
`}</Code>
      <Callout type="warning" title="Changing the model later">
        Each time you change a field, run <code>makemigrations</code> and then <code>migrate</code>. Adding a new required field to a
        table that already has rows makes <code>makemigrations</code> ask for a default value. See
        <L to="troubleshooting/common-problems" s="migration-errors"> Migration errors</L>.
      </Callout>

      <H2>Admin registration</H2>
      <Code lang="python" file="backend/products/admin.py" code={CODE.admin} />
      <p>
        One line makes products manageable at <code>/admin/</code>. This is handy for checking what the API saved, and for
        deleting test data. Log in with a superuser created by <code>createsuperuser</code>.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
function Serializers() {
  return (
    <>
      <p>
        <code>backend/products/serializers.py</code> defines two serializers: one for user registration and one for products.
        Both extend <code>ModelSerializer</code>.
      </p>

      <H2>ModelSerializer</H2>
      <p>
        A plain <code>serializers.Serializer</code> makes you declare every field by hand. <code>ModelSerializer</code> reads a model
        and generates the fields for you, copying constraints such as <code>max_length</code>, required/optional status,
        uniqueness and read-only status. It also provides default <code>create()</code> and <code>update()</code> methods.
      </p>
      <Table head={['Meta option', 'Purpose']} rows={[
        [<code>model</code>, 'The model to introspect.'],
        [<code>fields</code>, <><code>'__all__'</code> or an explicit list. An explicit list is safer: new model fields are not exposed by accident.</>],
      ]} />

      <H2>RegisterSerializer</H2>
      <Code lang="python" file="backend/products/serializers.py" code={CODE.registerSerializer} lines mark={['write_only', 'create_user']} />
      <DefList items={[
        ['model = User', 'Django’s built-in auth user (django.contrib.auth.models.User).'],
        ["fields = [...]", 'Only these four fields are accepted or returned; is_staff, is_superuser and others cannot be set through the API.'],
        ['password = CharField(write_only=True)', 'Declaring the field explicitly overrides the generated one. write_only means it is accepted as input but never included in serializer.data.'],
        ['def create()', 'Overrides ModelSerializer.create(). The default would save the password as plain text; create_user() hashes it with Django’s password hasher (PBKDF2 by default).'],
      ]} />
      <p>
        <code>username</code> inherits the model’s unique constraint, so the serializer adds a uniqueness validator automatically. That
        produces <code>"A user with that username already exists."</code> without any extra code.
      </p>
      <Callout type="warning" title="email is optional on the model">
        <code>User.email</code> is declared with <code>blank=True</code>, so the generated <code>email</code> field is not required.
        <code> create()</code>, however, reads <code>validated_data['email']</code>. A request without an email passes validation and then
        crashes with <code>KeyError: 'email'</code> (HTTP 500). Send an email with every registration, or apply the fix shown in
        <L to="best-practices/improvements" s="known-limitations-of-the-current-code"> Known limitations</L>.
      </Callout>

      <H2>ProductSerializer</H2>
      <Code lang="python" file="backend/products/serializers.py" code={CODE.productSerializer} lines mark={['def validate_image', 'value.size', 'allowed_extensions =']} />
      <p>With <code>fields = '__all__'</code>, DRF generates these serializer fields from the model:</p>
      <Table head={['Field', 'Serializer field', 'Read-only?', 'Why']} rows={[
        [<code>id</code>, 'IntegerField', 'Yes', 'Primary keys are never writable'],
        [<code>name</code>, 'CharField(max_length=100)', 'No', ''],
        [<code>description</code>, 'CharField (multi-line)', 'No', ''],
        [<code>price</code>, 'DecimalField(max_digits=10, decimal_places=2)', 'No', ''],
        [<code>image</code>, 'ImageField', 'No', ''],
        [<code>created_at</code>, 'DateTimeField', 'Yes', 'auto_now_add makes it non-editable'],
      ]} />

      <H2>Custom validation</H2>
      <p>DRF validates data in layers. Knowing the order explains which error you see first:</p>
      <ol>
        <li><strong>Field validation.</strong> Each field’s type checks: required, max length, valid decimal, valid image.</li>
        <li><strong>Field-level hooks:</strong> a method named <code>validate_&lt;field_name&gt;(self, value)</code>, called only if step 1 passed for that field.</li>
        <li><strong>Object-level hook:</strong> <code>validate(self, attrs)</code> for rules that involve several fields. This project does not define one.</li>
      </ol>
      <p>
        A field-level validator either returns the (possibly modified) value or raises <code>serializers.ValidationError</code>. The
        error message ends up under that field’s key in <code>serializer.errors</code>.
      </p>

      <H2>Image validation</H2>
      <p><code>validate_image</code> runs after DRF’s <code>ImageField</code> has already confirmed, using Pillow, that the upload is a real image. It adds two project rules:</p>
      <H3>Size limit: 2 MB</H3>
      <Code lang="python">{`
if value.size > 2 * 1024 * 1024:
    raise serializers.ValidationError(
        "Image size should not exceed 2 MB"
    )
`}</Code>
      <p><code>value</code> is a Django <code>UploadedFile</code>; <code>.size</code> is in bytes. <code>2 * 1024 * 1024</code> = 2,097,152 bytes. Exactly 2 MB is allowed; one byte more is rejected.</p>
      <H3>Allowed extensions</H3>
      <Code lang="python">{`
allowed_extensions = ['jpg', 'jpeg', 'png']
extension = value.name.split('.')[-1].lower()
`}</Code>
      <p>
        The extension is the text after the last dot, lower-cased so <code>PHOTO.PNG</code> is accepted. A GIF or WebP file passes
        Pillow’s check (it is a valid image) but fails this one with <code>"Only JPG, JPEG and PNG images are allowed"</code>.
      </p>
      <Callout type="note">
        The extension check looks at the file <em>name</em>. A real PNG renamed to <code>photo.jpg</code> passes. The content check
        that actually protects you is Pillow’s, which runs first. More in <L to="image-upload/validation-and-replacement">Image validation and replacement</L>.
      </Callout>

      <H2>Serializer output</H2>
      <Code lang="json" file="ProductSerializer(product).data">{`
{
  "id": 1,
  "name": "Wireless Mouse",
  "description": "Ergonomic 2.4 GHz wireless mouse",
  "price": "25.99",
  "image": "/media/products/mouse.png",
  "created_at": "2026-11-21T14:40:12.481203Z"
}
`}</Code>
      <p>
        DRF’s <code>ImageField</code> returns an absolute URL only when the serializer’s context contains the request
        (<code>ProductSerializer(product, context={'{'}'request': request{'}'})</code>). The views here don’t pass a context, so
        <code> image</code> is the relative <code>MEDIA_URL</code> path.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
function Views() {
  return (
    <>
      <p>
        Every endpoint the project writes itself is a function in <code>backend/products/views.py</code> decorated with
        <code> @api_view</code>. This page explains the shared structure; the CRUD and JWT sections walk through each view in detail.
      </p>

      <H2>Imports</H2>
      <Code lang="python" file="backend/products/views.py" code={CODE.viewImports} />
      <DefList items={[
        ['api_view, permission_classes, parser_classes', 'Decorators that turn a function into a configured DRF view.'],
        ['AllowAny, IsAuthenticated', 'Permission classes.'],
        ['Response, status', 'DRF’s response object and named HTTP status constants.'],
        ['RefreshToken', 'Simple JWT token class, used by logout to blacklist a token.'],
        ['get_object_or_404', 'Django shortcut: return the object or raise Http404.'],
        ['MultiPartParser, FormParser', 'Parsers that read multipart/form-data and URL-encoded forms.'],
      ]} />

      <H2>The view inventory</H2>
      <Table head={['Function', 'Methods', 'Permission', 'Parsers', 'Covered in']} rows={[
        [<code>register</code>, <Method m="POST" />, 'AllowAny', 'default', <L to="jwt/register-and-login">Registration API</L>],
        [<code>logout</code>, <Method m="POST" />, 'IsAuthenticated', 'default', <L to="jwt/logout-and-blacklisting">Logout API</L>],
        [<code>create_product</code>, <Method m="POST" />, 'IsAuthenticated', 'MultiPart, Form', <L to="crud/create">Create</L>],
        [<code>get_products</code>, <Method m="GET" />, 'IsAuthenticated', 'default', <L to="crud/read">Retrieve</L>],
        [<code>get_product</code>, <Method m="GET" />, 'IsAuthenticated', 'default', <L to="crud/read">Retrieve</L>],
        [<code>update_product</code>, <><Method m="PUT" /> <Method m="PATCH" /></>, 'IsAuthenticated', 'MultiPart, Form', <L to="crud/update">Update</L>],
        [<code>delete_product</code>, <Method m="DELETE" />, 'IsAuthenticated', 'default', <L to="crud/delete">Delete</L>],
      ]} />
      <p>“default” parsers means DRF’s defaults: JSONParser, FormParser and MultiPartParser.</p>

      <H2>The pattern every write view follows</H2>
      <Code lang="python" file="backend/products/views.py" code={CODE.createProduct} lines />
      <ol>
        <li><strong>Build the serializer</strong> from <code>request.data</code> (and an instance, for updates).</li>
        <li><strong>Validate</strong> with <code>is_valid()</code>. It returns a boolean and fills <code>serializer.errors</code> on failure.</li>
        <li><strong>Save</strong> with <code>serializer.save()</code>, which calls <code>create()</code> or <code>update()</code>.</li>
        <li><strong>Respond</strong> with a message, the serialized data, and an explicit status code.</li>
        <li><strong>Otherwise respond</strong> with <code>serializer.errors</code> and 400.</li>
      </ol>
      <Callout type="tip" title="The shorter alternative">
        <code>serializer.is_valid(raise_exception=True)</code> raises a <code>ValidationError</code> that DRF turns into the same 400 response,
        removing the <code>if</code>/<code>return</code> pair. The project uses the explicit form, which shows both outcomes clearly.
      </Callout>

      <H2>Decorator order</H2>
      <p>
        <code>@api_view</code> must be the top decorator. Decorators apply from the bottom up: <code>@parser_classes</code> and
        <code> @permission_classes</code> attach settings to the plain function first, then <code>@api_view</code> reads those settings
        when it builds the view. If <code>@api_view</code> is placed lower, the settings are attached to the already-built view
        and are silently ignored.
      </p>

      <H2>Earlier versions in the file</H2>
      <p>
        <code>views.py</code> also contains commented-out first drafts of <code>create_product</code> and <code>update_product</code>
        without <code>@parser_classes</code>. They show how the views evolved when image upload was added. Only the uncommented
        versions run.
      </p>
    </>
  );
}

/* ------------------------------------------------------------------ */
function Urls() {
  return (
    <>
      <H2>Root URLconf</H2>
      <p>Django starts URL matching at <code>ROOT_URLCONF = 'config.urls'</code>:</p>
      <Code lang="python" file="backend/config/urls.py" code={CODE.rootUrls} lines mark={["path('api/'", 'static(']} />
      <DefList items={[
        ["path('admin/', …)", 'Django’s admin site.'],
        ["path('api/', include('products.urls'))", 'Strips the api/ prefix and hands the rest of the path to products/urls.py.'],
        ['static(MEDIA_URL, …)', 'Adds a route that serves files from MEDIA_ROOT, only while DEBUG is True. It returns an empty list otherwise, and the if guard makes that explicit.'],
      ]} />

      <H2>App URLconf</H2>
      <Code lang="python" file="backend/products/urls.py" code={CODE.appUrls} lines mark={["path('login/'", "path('token/refresh/'"]} />
      <Table head={['Pattern', 'Full URL', 'Handled by']} rows={[
        [<code>register/</code>, <code>/api/register/</code>, <code>register</code>],
        [<code>login/</code>, <code>/api/login/</code>, <><code>TokenObtainPairView.as_view()</code> (Simple JWT)</>],
        [<code>token/refresh/</code>, <code>/api/token/refresh/</code>, <><code>TokenRefreshView.as_view()</code> (Simple JWT)</>],
        [<code>logout/</code>, <code>/api/logout/</code>, <code>logout</code>],
        [<code>products/create/</code>, <code>/api/products/create/</code>, <code>create_product</code>],
        [<code>products/</code>, <code>/api/products/</code>, <code>get_products</code>],
        [<code>products/&lt;int:pk&gt;/</code>, <code>/api/products/{'{id}'}/</code>, <code>get_product</code>],
        [<code>products/&lt;int:pk&gt;/update/</code>, <code>/api/products/{'{id}'}/update/</code>, <code>update_product</code>],
        [<code>products/&lt;int:pk&gt;/delete/</code>, <code>/api/products/{'{id}'}/delete/</code>, <code>delete_product</code>],
      ]} />

      <H3>The custom login path</H3>
      <p>
        Simple JWT’s documentation mounts <code>TokenObtainPairView</code> at <code>api/token/</code>. This project mounts the same view at
        <code> login/</code>, so the login URL reads naturally as <code>/api/login/</code>. The refresh view keeps its conventional
        <code> token/refresh/</code> path. <code>/api/token/</code> does not exist here and returns 404.
      </p>
      <H3>Path converters</H3>
      <p>
        <code>&lt;int:pk&gt;</code> matches one or more digits, converts them to a Python <code>int</code>, and passes the value to the view
        as the keyword argument <code>pk</code>. That is why each detail view is declared as <code>def get_product(request, pk)</code>. A
        non-numeric id such as <code>/api/products/abc/</code> matches no pattern and returns Django’s 404 page.
      </p>
      <H3>Class-based Simple JWT views</H3>
      <p>
        Simple JWT’s views are classes, so they are mounted with <code>.as_view()</code>. Every view written for this project is a
        function and is passed directly. Using ready-made views for login and refresh while writing the rest as functions is
        a common and perfectly valid mix.
      </p>
      <Callout type="note" title="Duplicate refresh route">
        <code>token/refresh/</code> is listed twice. Django uses the first match, so the second entry is never reached. Removing it
        changes nothing.
      </Callout>
      <Callout type="tip" title="Trailing slashes">
        Every pattern ends with <code>/</code>. With Django’s default <code>APPEND_SLASH = True</code>, a <code>GET</code> to
        <code> /api/products</code> is redirected to <code>/api/products/</code>, but a <code>POST</code> without the slash raises an error
        in DEBUG mode because a redirect would drop the body. Always include the trailing slash.
      </Callout>
    </>
  );
}

export default [
  { slug: 'backend/project-and-app', group: GROUP, title: 'Creating the Project and App', nav: 'Project, app & packages', Body: ProjectAndApp,
    lede: 'Install the packages, generate the Django project, and add the products app.' },
  { slug: 'backend/settings', group: GROUP, title: 'Configuring Settings', Body: Settings,
    lede: 'Installed apps, DRF defaults, JWT lifetimes, media storage and the database: every setting the API relies on.' },
  { slug: 'backend/product-model', group: GROUP, title: 'Product Model and Migrations', nav: 'Product model & migrations', Body: ProductModel,
    lede: 'The single database table behind the API, how it became a migration, and how it appears in the admin.' },
  { slug: 'backend/serializers', group: GROUP, title: 'Serializers and Validation', nav: 'Serializers & validation', Body: Serializers,
    lede: 'RegisterSerializer and ProductSerializer: ModelSerializer basics, custom create(), and the image validation rules.' },
  { slug: 'backend/views', group: GROUP, title: 'Function-Based Views', Body: Views,
    lede: 'How each @api_view function is built, configured with decorators, and organised in views.py.' },
  { slug: 'backend/urls', group: GROUP, title: 'URL Routing', Body: Urls,
    lede: 'How a URL travels from config/urls.py to the right view, including the custom /api/login/ path.' },
];
