/**
 * Content registry. Groups appear in the sidebar in this order, and the
 * flattened page list drives previous/next navigation and search.
 */
import gettingStarted from './pages/gettingStarted.jsx';
import coreConcepts from './pages/coreConcepts.jsx';
import backend from './pages/backend.jsx';
import jwt from './pages/jwt.jsx';
import crud from './pages/crud.jsx';
import images from './pages/images.jsx';
import apiReference from './pages/apiReference.jsx';
import testing from './pages/testing.jsx';
import troubleshooting from './pages/troubleshooting.jsx';
import architecture from './pages/architecture.jsx';
import bestPractices from './pages/bestPractices.jsx';
import NotFound from './pages/NotFound.jsx';

const sections = [
  ['getting-started', 'Getting Started', gettingStarted],
  ['core-concepts', 'Core Concepts', coreConcepts],
  ['backend', 'Building the Backend', backend],
  ['jwt', 'JWT Authentication', jwt],
  ['crud', 'Product CRUD', crud],
  ['image-upload', 'Image Upload', images],
  ['api', 'API Reference', apiReference],
  ['testing', 'Testing With Thunder Client', testing],
  ['troubleshooting', 'Troubleshooting', troubleshooting],
  ['architecture', 'Architecture and Workflows', architecture],
  ['best-practices', 'Best Practices', bestPractices],
];

export const groups = sections.map(([id, title, pages]) => ({ id, title, pages }));
export const pages = groups.flatMap((g) => g.pages);
export const HOME_SLUG = 'getting-started/introduction';

export const pageBySlug = Object.fromEntries(pages.map((p) => [p.slug, p]));
pageBySlug['not-found'] = { slug: 'not-found', title: 'Page not found', Body: NotFound, lede: 'This page does not exist in DRF Atlas.' };
