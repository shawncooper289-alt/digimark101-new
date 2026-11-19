import Link from "next/link"
import { PageHeader } from "@/components/site/page-header"
import { pageMetadata } from "@/lib/seo"
import { formatDate, posts } from "@/lib/site"

export const metadata = pageMetadata({
  title: "Journal",
  description: "Studio notes from DigiMark101 on measurement, briefs, and the order we turn channels on.",
  path: "/blog",
})

export default function BlogPage() {
  return (
    <>
      <PageHeader
        eyebrow="06 — Journal"
        title="Notes from the studio."
        lede="Essays about the method. They are not client stories, and they do not smuggle in statistics we do not have."
      />
      <div className="mx-auto grid max-w-6xl gap-4 px-5 py-12 md:py-16">
        {posts.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="rounded-[1.5rem] border border-ink/10 bg-card p-6 hover:border-ink/30 md:grid md:grid-cols-12 md:items-end">
            <div className="md:col-span-8">
              <h2 className="font-serif text-3xl md:text-4xl">{post.title}</h2>
              <p className="mt-3 max-w-2xl text-ink-soft">{post.description}</p>
            </div>
            <p className="mt-4 text-sm text-ink-soft md:col-span-4 md:mt-0 md:text-right">
              {formatDate(post.date)} · {post.minutes} min
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}
