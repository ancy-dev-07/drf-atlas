import { LinkGrid } from '../../components/docs.jsx';

export default function NotFound() {
  return (
    <>
      <p>The link may be outdated. Use search (<kbd>Ctrl</kbd> + <kbd>K</kbd>) or start from one of these pages:</p>
      <LinkGrid items={[
        { to: 'getting-started/introduction', title: 'Introduction', text: 'Start here.' },
        { to: 'api/overview', title: 'API Reference', text: 'All endpoints.' },
        { to: 'testing/testing-the-api', title: 'Testing the API', text: 'The full test plan.' },
        { to: 'troubleshooting/http-errors', title: 'Troubleshooting', text: 'Fix common errors.' },
      ]} />
    </>
  );
}
