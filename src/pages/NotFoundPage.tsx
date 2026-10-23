import { Link } from 'react-router';
import { FilmIcon } from '../components/Icons';
import { StateMessage } from '../components/StateMessage';

export function NotFoundPage() {
  return (
    <StateMessage
      icon={<FilmIcon className="size-7" />}
      title="Lost in the reel"
      action={
        <Link to="/" className="rounded-full bg-gold px-6 py-2.5 text-sm font-semibold text-ink hover:bg-gold-soft">
          Back to search
        </Link>
      }
    >
      This page doesn’t exist. Let’s get you back to the movies.
    </StateMessage>
  );
}
