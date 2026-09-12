import { useEffect, useState } from 'react';
import { CONFIG } from '../config';

/** Top bar: only the GitHub star, with a live count from the public API. */
export default function StarButton() {
  const [stars, setStars] = useState<number | null>(null);
  const hasRepo = Boolean(CONFIG.githubUser && CONFIG.githubRepo);

  useEffect(() => {
    if (!hasRepo) return;
    let alive = true;
    // GitHub's public API, no key, no cost.
    fetch(`https://api.github.com/repos/${CONFIG.githubUser}/${CONFIG.githubRepo}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d && typeof d.stargazers_count === 'number') setStars(d.stargazers_count);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [hasRepo]);

  if (!hasRepo) return null;

  return (
    <div className="support">
      <div className="supportBtns">
        <a
          className="supBtn star"
          href={`https://github.com/${CONFIG.githubUser}/${CONFIG.githubRepo}`}
          target="_blank"
          rel="noopener"
        >
          <span>⭐</span> Star on GitHub
          <span className="starCount">{stars ?? ''}</span>
        </a>
      </div>
    </div>
  );
}
