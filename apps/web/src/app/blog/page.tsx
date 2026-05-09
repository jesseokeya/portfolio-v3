import Link from "next/link";
import { ArrowUpRightIcon } from "lucide-react";

import BlurFade from "../../components/magicui/blur-fade";
import { getBlogPosts } from "../../data/blog";
import { formatDate } from "../../lib/utils";

export const metadata = {
  title: "Blog",
  description: "My thoughts on software development, life, and more.",
};

const BLUR_FADE_DELAY = 0.04;

function groupByYear<T extends { metadata: { publishedAt: string } }>(
  posts: T[]
) {
  const buckets = new Map<string, T[]>();
  for (const post of posts) {
    const year = new Date(post.metadata.publishedAt).getUTCFullYear().toString();
    const list = buckets.get(year) ?? [];
    list.push(post);
    buckets.set(year, list);
  }
  return Array.from(buckets.entries()).sort(
    ([a], [b]) => Number(b) - Number(a)
  );
}

export default async function BlogPage() {
  const posts = await getBlogPosts();
  const sorted = posts.sort(
    (a, b) =>
      new Date(b.metadata.publishedAt).getTime() -
      new Date(a.metadata.publishedAt).getTime()
  );
  const [featured, ...rest] = sorted;
  const grouped = groupByYear(rest);

  return (
    <section className="space-y-12">
      <BlurFade delay={BLUR_FADE_DELAY}>
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-500">
            Writing
          </p>
          <h1 className="font-medium text-3xl tracking-tighter">
            Notes on building, shipping, and thinking out loud.
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 max-w-prose">
            {posts.length} posts on AI, startups, and the long road from idea to
            revenue.
          </p>
        </header>
      </BlurFade>

      {featured && (
        <BlurFade delay={BLUR_FADE_DELAY * 2}>
          <Link
            href={`/blog/${featured.slug}`}
            className="group relative block rounded-2xl border border-neutral-200/70 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-900/30 p-6 sm:p-8 transition-all hover:border-neutral-300 dark:hover:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-900/50"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Latest
              </span>
              <span className="text-xs text-neutral-500 dark:text-neutral-500">
                {formatDate(featured.metadata.publishedAt)}
              </span>
              {featured.metadata.readingTime && (
                <>
                  <span className="text-neutral-300 dark:text-neutral-700">
                    ·
                  </span>
                  <span className="text-xs text-neutral-500 dark:text-neutral-500">
                    {featured.metadata.readingTime}
                  </span>
                </>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-medium tracking-tight mb-2 pr-8">
              {featured.metadata.title}
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-prose">
              {featured.metadata.summary}
            </p>
            <ArrowUpRightIcon className="absolute top-6 right-6 h-4 w-4 text-neutral-400 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-neutral-900 dark:group-hover:text-neutral-100" />
          </Link>
        </BlurFade>
      )}

      <div className="space-y-10">
        {grouped.map(([year, yearPosts], groupIdx) => (
          <BlurFade
            key={year}
            delay={BLUR_FADE_DELAY * 3 + groupIdx * 0.05}
          >
            <div className="space-y-1">
              <div className="flex items-baseline gap-3 mb-3">
                <h2 className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-500 dark:text-neutral-500">
                  {year}
                </h2>
                <span className="flex-1 h-px bg-neutral-200 dark:bg-neutral-800" />
                <span className="text-xs text-neutral-400 dark:text-neutral-600">
                  {yearPosts.length}
                </span>
              </div>
              <ul className="divide-y divide-neutral-200/70 dark:divide-neutral-800">
                {yearPosts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="group flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 sm:gap-6 py-4 -mx-2 px-2 rounded-lg transition-colors hover:bg-neutral-100/60 dark:hover:bg-neutral-900/40"
                    >
                      <div className="min-w-0 flex-1 space-y-1">
                        <h3 className="font-medium tracking-tight text-neutral-900 dark:text-neutral-100 group-hover:text-neutral-900 dark:group-hover:text-white transition-colors">
                          {post.metadata.title}
                        </h3>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-2 leading-relaxed">
                          {post.metadata.summary}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-neutral-500 dark:text-neutral-500 shrink-0 sm:text-right tabular-nums">
                        <time dateTime={post.metadata.publishedAt}>
                          {new Date(post.metadata.publishedAt).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </time>
                        {post.metadata.readingTime && (
                          <>
                            <span className="text-neutral-300 dark:text-neutral-700">
                              ·
                            </span>
                            <span>{post.metadata.readingTime}</span>
                          </>
                        )}
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </BlurFade>
        ))}
      </div>
    </section>
  );
}
