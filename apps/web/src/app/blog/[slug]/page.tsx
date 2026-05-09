import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "lucide-react";

import { getBlogPosts, getPost } from "../../../data/blog";
import { DATA } from "../../../data/resume";
import { formatDate } from "../../../lib/utils";
import { MermaidScript } from "../../../components/mermaid-script";
import { BlogAudioPlayer } from "../../../components/blog-audio-player";

export async function generateStaticParams() {
  const posts = await getBlogPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: {
    slug: string;
  };
}): Promise<Metadata | undefined> {
  const post = await getPost(params.slug);

  const {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata;
  const ogImage = image
    ? `${DATA.url}${image}`
    : `${DATA.url}/og?title=${title}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "article",
      publishedTime,
      url: `${DATA.url}/blog/${post.slug}`,
      images: [
        {
          url: ogImage,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

export default async function Blog({
  params,
}: {
  params: {
    slug: string;
  };
}) {
  const post = await getPost(params.slug);

  if (!post) {
    notFound();
  }

  return (
    <section id="blog">
      <MermaidScript />
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "BlogPosting",
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${DATA.url}${post.metadata.image}`
              : `${DATA.url}/og?title=${post.metadata.title}`,
            url: `${DATA.url}/blog/${post.slug}`,
            author: {
              "@type": "Person",
              name: DATA.name,
            },
          }),
        }}
      />
      <Link
        href="/blog"
        className="group inline-flex items-center gap-1.5 mb-6 text-sm text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
      >
        <ArrowLeftIcon className="h-3.5 w-3.5 transition-transform group-hover:-translate-x-0.5" />
        Back to blog
      </Link>
      <BlogAudioPlayer rootId="readable-content" slug={post.slug} />
      <div id="readable-content">
        <h1 className="title font-medium text-2xl tracking-tighter max-w-[650px]">
          {post.metadata.title}
        </h1>
        <div className="flex justify-between items-center mt-2 mb-6 text-sm max-w-[650px]">
          <Suspense fallback={<p className="h-5" />}>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {formatDate(post.metadata.publishedAt)}
            </p>
          </Suspense>
        </div>
        <article
          className="prose dark:prose-invert"
          dangerouslySetInnerHTML={{ __html: post.source }}
        ></article>
      </div>
      <div className="mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-800 max-w-[650px]">
        <Link
          href="/blog"
          className="group inline-flex items-center justify-between w-full text-sm hover:text-neutral-900 dark:hover:text-neutral-100 text-neutral-600 dark:text-neutral-400 transition-colors"
        >
          <span className="inline-flex items-center gap-2">
            <ArrowLeftIcon className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            <span>
              <span className="block text-xs uppercase tracking-wider text-neutral-500 dark:text-neutral-500">
                Back
              </span>
              <span className="block font-medium">All posts</span>
            </span>
          </span>
          <span className="inline-flex items-center gap-1 text-neutral-500 dark:text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-neutral-100">
            View archive
            <ArrowRightIcon className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>
    </section>
  );
}
