import Link from "next/link"
import { notFound } from "next/navigation"
import { JsonLd } from "@/components/site/json-ld"
import { articleJsonLd, breadcrumbJsonLd, pageMetadata } from "@/lib/seo"
import { formatDate, getPost, posts } from "@/lib/site"

export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }))
}

export const dynamicParams = false

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) return {}
  return pageMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    ogType: "article",
    publishedTime: post.date,
  })
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getPost(slug)
  if (!post) notFound()

  return (
    <article className="mx-auto max-w-3xl px-5 py-16">
      <JsonLd
        data={[
          breadcrumbJsonLd([
            { name: "Home", path: "/" },
            { name: "Journal", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          articleJsonLd({
            title: post.title,
            description: post.description,
            path: `/blog/${post.slug}`,
            date: post.date,
          }),
        ]}
      />
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-signal">Studio note</p>
      <h1 className="display mt-4 text-4xl md:text-6xl">{post.title}</h1>
      <p className="mt-4 text-sm text-ink-soft">
        {formatDate(post.date)} · {post.minutes} minute read · DigiMark101 studio
      </p>
      <div className="prose-studio mt-8">
        {post.blocks.map((block, index) => {
          if (block.type === "h2") return <h2 key={index}>{block.text}</h2>
          if (block.type === "ul") {
            return (
              <ul key={index}>
                {block.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            )
          }
          return <p key={index}>{block.text}</p>
        })}
      </div>
      <Link href="/blog" className="mt-12 inline-block text-sm font-semibold text-signal">
        All notes
      </Link>
    </article>
  )
}
