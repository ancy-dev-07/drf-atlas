import { Callout, Code, H2, H3, L, Table } from '../../components/docs.jsx';

const GROUP = 'Best Practices and Improvements';

const Impl = ({ children }) => <Callout type="impl" title="Implemented">{children}</Callout>;
const Next = ({ children, title }) => <Callout type="future" title={title || 'Suggested improvement'}>{children}</Callout>;

/* ------------------------------------------------------------------ */
function Security() {
  return (
    <>
      <p>
        Each topic separates what the project <strong>already does</strong> from what is <strong>suggested</strong>. Suggested code is
        not part of the project.
      </p>

      <H2>Input validation</H2>
      <Impl>
        <ul>
          <li>All writes go through serializers; model constraints (max length, decimal precision, required fields) are enforced automatically.</li>
          <li>Images are checked by Pillow, then by <code>validate_image</code> for size and extension.</li>
          <li>Read-only fields (<code>id</code>, <code>created_at</code>) cannot be set by clients.</li>
          <li>RegisterSerializer exposes only username, email and password, so clients cannot set <code>is_staff</code> or <code>is_superuser</code>.</li>
        </ul>
      </Impl>
      <Next>
        <ul>
          <li>Replace <code>fields = '__all__'</code> with an explicit list so future model fields are not exposed by accident.</li>
          <li>Add business rules, e.g. reject negative prices with a <code>validate_price</code> method (the model currently accepts <code>-5.00</code>).</li>
        </ul>
        <Code lang="python">{`
def validate_price(self, value):
    if value <= 0:
        raise serializers.ValidationError("Price must be greater than zero")
    return value
`}</Code>
      </Next>

      <H2>Password security</H2>
      <Impl>Passwords are hashed with Django’s default PBKDF2-SHA256 hasher through <code>create_user()</code>, never returned (<code>write_only</code>), and checked with constant-time comparison by <code>authenticate()</code>.</Impl>
      <Next>
        Apply <code>AUTH_PASSWORD_VALIDATORS</code> during registration. They are configured in settings but only used by forms and
        <code> createsuperuser</code>:
        <Code lang="python" file="serializers.py — suggested">{`
from django.contrib.auth.password_validation import validate_password as django_validate_password

class RegisterSerializer(serializers.ModelSerializer):
    ...
    def validate_password(self, value):
        django_validate_password(value)   # too short, too common, numeric only, similar to username
        return value
`}</Code>
        DRF converts Django’s <code>ValidationError</code> into field errors automatically. Also consider rate-limiting login with DRF throttling.
      </Next>

      <H2>JWT security</H2>
      <Impl>
        <ul>
          <li>Short access lifetime (30 minutes) limits the window for a leaked token.</li>
          <li>Refresh tokens can be revoked through the blacklist at logout.</li>
          <li>Token type is enforced: refresh tokens cannot authenticate requests, and access tokens cannot be refreshed.</li>
        </ul>
      </Impl>
      <Next>
        <ul>
          <li><strong>Use a dedicated signing key</strong> via <code>SIMPLE_JWT['SIGNING_KEY']</code> loaded from the environment, so rotating it does not affect Django’s other uses of <code>SECRET_KEY</code>.</li>
          <li><strong>Enable rotation:</strong> <code>ROTATE_REFRESH_TOKENS = True</code> and <code>BLACKLIST_AFTER_ROTATION = True</code>.</li>
          <li><strong>HTTPS only in production.</strong> A Bearer token is a password-equivalent; over plain HTTP it can be intercepted.</li>
          <li><strong>Check ownership in logout:</strong> compare <code>token['user_id']</code> with <code>str(request.user.id)</code> before blacklisting.</li>
          <li><strong>Frontend storage:</strong> prefer in-memory access tokens and, for browsers, consider an HttpOnly cookie for the refresh token.</li>
          <li>Run <code>python manage.py flushexpiredtokens</code> periodically to prune the blacklist tables.</li>
        </ul>
      </Next>

      <H2>File upload security</H2>
      <Impl>Content check with Pillow, 2 MB size cap, extension allow-list, and Django’s storage never overwrites existing files (it appends a random suffix instead).</Impl>
      <Next>
        <ul>
          <li>Verify the actual format, not just the extension: <code>Image.open(value).format in ('PNG', 'JPEG')</code>.</li>
          <li>Generate file names server-side (e.g. a UUID) instead of keeping user-supplied names, which can leak information.</li>
          <li>Limit request size globally with <code>DATA_UPLOAD_MAX_MEMORY_SIZE</code> / <code>FILE_UPLOAD_MAX_MEMORY_SIZE</code> and at the reverse proxy.</li>
          <li>Remember that <code>/media/</code> is public: don’t store private files there.</li>
        </ul>
        <Code lang="python" file="models.py — suggested">{`
import uuid
from pathlib import Path

def product_image_path(instance, filename):
    return f"products/{uuid.uuid4().hex}{Path(filename).suffix.lower()}"

image = models.ImageField(upload_to=product_image_path)
`}</Code>
      </Next>

      <H2>Environment variables</H2>
      <p>
        <code>settings.py</code> currently hard-codes <code>SECRET_KEY</code> and <code>DEBUG = True</code>. That is normal for a fresh
        <code> startproject</code>, but these values must not reach version control or production. Read them from the environment:
      </p>
      <Code lang="python" file="settings.py — suggested">{`
import os

SECRET_KEY = os.environ["DJANGO_SECRET_KEY"]
DEBUG = os.environ.get("DJANGO_DEBUG", "False") == "True"
ALLOWED_HOSTS = os.environ.get("DJANGO_ALLOWED_HOSTS", "").split(",")
`}</Code>
      <Code lang="bash" file=".env (never commit this file)">{`
DJANGO_SECRET_KEY=change-me-to-a-long-random-string
DJANGO_DEBUG=True
DJANGO_ALLOWED_HOSTS=127.0.0.1,localhost
`}</Code>
      <p>Packages such as <code>python-dotenv</code> or <code>django-environ</code> load a <code>.env</code> file automatically. Generate a key with <code>python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"</code>.</p>
      <Callout type="warning">Because <code>SECRET_KEY</code> signs the JWTs, anyone who knows it can forge a token for any user. Treat it like a database password.</Callout>
    </>
  );
}

/* ------------------------------------------------------------------ */
function Improvements() {
  return (
    <>
      <H2>Known limitations of the current code</H2>
      <p>These behaviours were confirmed by running the project. None of them blocks learning, but each is worth fixing before real use.</p>
      <Table head={['Area', 'Behaviour today', 'Suggested fix']} rows={[
        ['Register', <>Omitting <code>email</code> → 500 <code>KeyError</code></>, <><code>extra_kwargs = {'{'}'email': {'{'}'required': True{'}}'}</code> in Meta, or <code>validated_data.get('email', '')</code></>],
        ['Register', 'Password validators not applied', <>Add <code>validate_password</code> (see <L to="best-practices/security" s="password-security">Password security</L>)</>],
        ['Logout', <><code>except Exception</code> hides real errors such as a missing table</>, <>Catch <code>TokenError</code> only</>],
        ['Logout', 'Any valid refresh token can be blacklisted, regardless of owner', 'Compare token user_id with request.user'],
        ['Logout', '205 with a JSON body', 'Return 200, or 205 without a body'],
        ['Products', 'Any authenticated user can edit or delete any product', <>Owner field + check (see <L to="best-practices/improvements" s="permissions">Permissions</L>)</>],
        ['Products', 'List unordered and unpaginated', 'order_by + pagination'],
        ['Images', 'Replaced/deleted images stay on disk', 'Delete old file in update/delete, or django-cleanup'],
        ['Images', 'Relative image URLs', <>Pass <code>context={'{'}'request': request{'}'}</code> to serializers</>],
        ['URLs', <><code>token/refresh/</code> declared twice</>, 'Remove the duplicate'],
        ['Repo', <>Root <code>manage.py</code> points to non-existent <code>backend.settings</code></>, 'Delete it'],
        ['Repo', 'No requirements.txt, empty tests.py', 'pip freeze > requirements.txt; add tests'],
      ]} />
      <Code lang="python" file="serializers.py — suggested fix for the email crash">{`
class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password']
        extra_kwargs = {'email': {'required': True}}
`}</Code>

      <H2>Pagination</H2>
      <p>Pagination works in function-based views too. You call the paginator yourself:</p>
      <Code lang="python" file="views.py — suggested">{`
from rest_framework.pagination import PageNumberPagination

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_products(request):
    products = Product.objects.order_by('-created_at')   # pagination needs a stable order

    paginator = PageNumberPagination()
    paginator.page_size = 10
    page = paginator.paginate_queryset(products, request)

    serializer = ProductSerializer(page, many=True, context={'request': request})
    return paginator.get_paginated_response(serializer.data)
`}</Code>
      <Code lang="json" file="GET /api/products/?page=2">{`
{
  "count": 23,
  "next": "http://127.0.0.1:8000/api/products/?page=3",
  "previous": "http://127.0.0.1:8000/api/products/",
  "results": [ ... ]
}
`}</Code>
      <p>The response shape changes to DRF’s pagination envelope, so update clients accordingly, or wrap it in your own <code>message</code>/<code>data</code> structure.</p>

      <H2>Filtering</H2>
      <p>Read query parameters from <code>request.query_params</code> and narrow the queryset. Validate them so bad input returns 400 instead of 500:</p>
      <Code lang="python" file="views.py — suggested">{`
from decimal import Decimal, InvalidOperation

products = Product.objects.all()

min_price = request.query_params.get('min_price')
if min_price:
    try:
        products = products.filter(price__gte=Decimal(min_price))
    except InvalidOperation:
        return Response({"min_price": ["A valid number is required."]},
                        status=status.HTTP_400_BAD_REQUEST)
`}</Code>
      <p>Example: <code>GET /api/products/?min_price=20</code>. For many filters, <code>django-filter</code> generates this code from declarations.</p>

      <H2>Search</H2>
      <Code lang="python" file="views.py — suggested">{`
from django.db.models import Q

q = request.query_params.get('search')
if q:
    products = products.filter(Q(name__icontains=q) | Q(description__icontains=q))
`}</Code>
      <p><code>GET /api/products/?search=mouse</code> matches “Wireless Mouse”. <code>icontains</code> is case-insensitive. For large datasets, use database full-text search (e.g. PostgreSQL).</p>

      <H2>Permissions</H2>
      <p>To let users manage only their own products, record the owner and check it in the write views:</p>
      <Code lang="python" file="models.py — suggested">{`
from django.conf import settings

class Product(models.Model):
    owner = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE,
                              related_name='products', null=True)
    ...
`}</Code>
      <Code lang="python" file="views.py — suggested">{`
# create_product
serializer.save(owner=request.user)

# update_product / delete_product, after get_object_or_404
if product.owner != request.user:
    return Response({"detail": "You do not own this product."},
                    status=status.HTTP_403_FORBIDDEN)
`}</Code>
      <p>
        Add <code>owner</code> to <code>read_only_fields</code> in the serializer so clients cannot reassign it, then run
        <code> makemigrations</code> and <code>migrate</code>. This is where <strong>403 Forbidden</strong> finally appears: the user is known
        but not allowed.
      </p>

      <H2>Testing</H2>
      <p>DRF’s <code>APITestCase</code> runs each test against a fresh test database. This suite was run against the project and passes:</p>
      <Code lang="python" file="products/tests.py — suggested">{`
import io
import shutil
import tempfile

from django.contrib.auth.models import User
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from PIL import Image
from rest_framework import status
from rest_framework.test import APITestCase

TEMP_MEDIA = tempfile.mkdtemp()


def make_png(name='test.png'):
    buffer = io.BytesIO()
    Image.new('RGB', (10, 10), 'teal').save(buffer, 'PNG')
    return SimpleUploadedFile(name, buffer.getvalue(), content_type='image/png')


@override_settings(MEDIA_ROOT=TEMP_MEDIA)
class ProductApiTests(APITestCase):

    @classmethod
    def tearDownClass(cls):
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)
        super().tearDownClass()

    def setUp(self):
        User.objects.create_user('tester', 'tester@example.com', 'pass12345')
        res = self.client.post(
            '/api/login/',
            {'username': 'tester', 'password': 'pass12345'},
            format='json',
        )
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {res.data['access']}")

    def test_list_requires_authentication(self):
        self.client.credentials()  # remove the token
        res = self.client.get('/api/products/')
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_product_with_image(self):
        res = self.client.post(
            '/api/products/create/',
            {'name': 'Mouse', 'description': 'Wireless', 'price': '25.99', 'image': make_png()},
            format='multipart',
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data['data']['price'], '25.99')

    def test_create_rejects_json(self):
        res = self.client.post('/api/products/create/', {'name': 'Mouse'}, format='json')
        self.assertEqual(res.status_code, status.HTTP_415_UNSUPPORTED_MEDIA_TYPE)

    def test_patch_updates_only_sent_fields(self):
        created = self.client.post(
            '/api/products/create/',
            {'name': 'Mouse', 'description': 'Wireless', 'price': '25.99', 'image': make_png()},
            format='multipart',
        ).data['data']
        res = self.client.patch(
            f"/api/products/{created['id']}/update/", {'price': '19.99'}, format='multipart'
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data['data']['price'], '19.99')
        self.assertEqual(res.data['data']['name'], 'Mouse')
`}</Code>
      <Code lang="bash" file="backend/">{`
python manage.py test products
`}</Code>
      <Code lang="text" file="Output">{`
Found 4 test(s).
Creating test database for alias 'default'...
System check identified no issues (0 silenced).
....
----------------------------------------------------------------------
Ran 4 tests in 28.997s

OK
Destroying test database for alias 'default'...
`}</Code>
      <p>
        Most of that time is password hashing: <code>create_user()</code> and login each run Django’s deliberately slow PBKDF2 hasher. Adding
        <code> PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']</code> to a test-only settings file makes the suite
        run in a fraction of the time. Never use that hasher outside tests.
      </p>
      <p><code>override_settings(MEDIA_ROOT=…)</code> keeps test uploads out of the real <code>media/</code> folder.</p>

      <H2>Production deployment</H2>
      <p>The development server and settings are not suitable for production. A minimal checklist:</p>
      <ul>
        <li><code>DEBUG = False</code>, <code>SECRET_KEY</code> from the environment, <code>ALLOWED_HOSTS</code> set to your domain.</li>
        <li>Serve over HTTPS; set <code>SECURE_SSL_REDIRECT</code>, <code>SESSION_COOKIE_SECURE</code>, <code>CSRF_COOKIE_SECURE</code>.</li>
        <li>Run with a production server: <code>gunicorn config.wsgi</code> (Linux) or an ASGI server such as <code>uvicorn config.asgi:application</code>, behind Nginx or a platform load balancer.</li>
        <li>Use PostgreSQL instead of SQLite for concurrent writes.</li>
        <li>Serve media through the web server or cloud storage (the <code>static()</code> route is disabled when DEBUG is off).</li>
        <li>Run <code>python manage.py check --deploy</code>; it lists remaining security settings to review.</li>
        <li>Pin dependencies in <code>requirements.txt</code>.</li>
      </ul>

      <H2>Cloud media storage</H2>
      <p>
        Local <code>MEDIA_ROOT</code> breaks on platforms with ephemeral disks or several servers. Django’s storage API lets you swap the
        backend without touching models or views. With <code>django-storages</code> and Amazon S3 (or any S3-compatible service):
      </p>
      <Code lang="python" file="settings.py — suggested">{`
STORAGES = {
    "default": {"BACKEND": "storages.backends.s3.S3Storage"},
    "staticfiles": {"BACKEND": "django.contrib.staticfiles.storage.StaticFilesStorage"},
}
AWS_STORAGE_BUCKET_NAME = os.environ["AWS_STORAGE_BUCKET_NAME"]
AWS_S3_REGION_NAME = os.environ.get("AWS_S3_REGION_NAME", "eu-central-1")
`}</Code>
      <p>
        <code>ImageField</code> then uploads to the bucket and <code>image</code> URLs point to it, already absolute. Cloudinary, Google
        Cloud Storage and Azure Blob Storage have equivalent backends.
      </p>
    </>
  );
}

export default [
  { slug: 'best-practices/security', group: GROUP, title: 'Security Best Practices', nav: 'Security practices', Body: Security,
    lede: 'Input validation, passwords, JWTs, file uploads and secrets: what the project does today and what to add next.' },
  { slug: 'best-practices/improvements', group: GROUP, title: 'Improvements and Next Steps', nav: 'Improvements', Body: Improvements,
    lede: 'Known limitations of the current code, and how to add pagination, filtering, search, permissions, tests, deployment and cloud storage.' },
];
