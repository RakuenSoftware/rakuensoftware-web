import { Route, Routes } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import ProductPage from './pages/ProductPage';
import AimeeCloud from './pages/AimeeCloud';
import BlogIndex from './pages/BlogIndex';
import BlogPost from './pages/BlogPost';
import NotFound from './pages/NotFound';

/**
 * aimee cloud has its own hostname but is the same app and the same build.
 *
 * On aimee.rakuensoftware.com the index route is the cloud page rather than the
 * company home page; everywhere else it is Home and the cloud page lives at
 * /cloud. Deciding here rather than with a second build or an nginx rewrite
 * keeps one artifact to deploy and one place to change it — and /cloud stays a
 * working URL on every host, so a link to it never depends on which name the
 * reader arrived by.
 */
function onCloudHost(): boolean {
  if (typeof window === 'undefined') return false;
  return window.location.hostname.startsWith('aimee.');
}

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={onCloudHost() ? <AimeeCloud /> : <Home />} />
        <Route path="products/:slug" element={<ProductPage />} />
        <Route path="cloud" element={<AimeeCloud />} />
        <Route path="blog" element={<BlogIndex />} />
        <Route path="blog/:slug" element={<BlogPost />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
