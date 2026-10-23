import { createBrowserRouter } from 'react-router';
import { Layout } from './components/Layout';
import { SearchPage } from './pages/SearchPage';
import { MoviePage } from './pages/MoviePage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <Layout />,
    children: [
      { index: true, element: <SearchPage /> },
      { path: 'movie/:id', element: <MoviePage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
