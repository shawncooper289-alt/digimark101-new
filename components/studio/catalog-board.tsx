"use client"

import Link from "next/link"
import { useState } from "react"
import { usePlatform } from "@/components/studio/platform-provider"
import {
  catalogGroups,
  CATALOG_APPS,
  CATALOG_RECIPES,
  statusLabel,
  withPaypalReady,
  type CatalogRecipe,
} from "@/lib/platform/catalog"

export function CatalogBoard({ paypalReady = false, showApps = true, showRecipes = true }: { paypalReady?: boolean; showApps?: boolean; showRecipes?: boolean }) {
  const platform = usePlatform()
  const [notice, setNotice] = useState("")
  const [error, setError] = useState("")
  const apps = withPaypalReady(CATALOG_APPS, paypalReady)

  async function turnOn(recipe: CatalogRecipe) {
    setError("")
    setNotice("")
    try {
      if (recipe.status === "works" && recipe.trigger && recipe.action) {
        const summary = await platform.run({
          type: "create_automation",
          name: recipe.name,
          trigger: recipe.trigger,
          action: recipe.action,
        })
        setNotice(summary)
        return
      }
      const summary = await platform.run({
        type: "remember",
        key: `request:${recipe.id}`.slice(0, 80),
        value: `Asked for “${recipe.name}”. This is a request only. It does not send, post, or charge anything.`,
      })
      setNotice(`${summary} Coming soon — nothing runs yet.`)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not save that.")
    }
  }

  return (
    <div className="grid gap-8">
      {notice ? <p className="text-sm font-medium text-pine" role="status">{notice}</p> : null}
      {error ? <p className="text-sm text-signal" role="alert">{error}</p> : null}
      {showApps
        ? catalogGroups(apps).map((group) => (
            <section key={group.name}>
              <h2 className="font-serif text-2xl">{group.name}</h2>
              <ul className="mt-3 grid gap-3">
                {group.apps.map((app) => (
                  <li key={app.id} className="rounded-3xl border border-ink/10 bg-card p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{app.name}</h3>
                        <p className="mt-1 text-sm text-ink-soft">{app.plain}</p>
                        <p className="mt-2 text-sm">{app.today}</p>
                      </div>
                      <span className="rounded-full border border-ink/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-signal">
                        {statusLabel(app.status)}
                      </span>
                    </div>
                    {app.href ? (
                      <Link href={app.href} className="mt-3 inline-block text-sm font-semibold text-signal underline">
                        {app.status === "connect" ? "Open Socials" : app.status === "request" ? "Request this" : "Open"}
                      </Link>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ))
        : null}
      {showRecipes ? (
        <section>
          <h2 className="font-serif text-2xl">Automatic notes</h2>
          <p className="mt-2 max-w-2xl text-sm text-ink-soft">
            A rule that works now only writes a note or a memory inside this workspace. If it says coming soon, saving it only records that you asked. It does not email, text, or post.
          </p>
          <ul className="mt-4 grid gap-3">
            {CATALOG_RECIPES.map((recipe) => (
              <li key={recipe.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-ink/10 bg-card p-4">
                <div>
                  <h3 className="font-medium">{recipe.name}</h3>
                  <p className="mt-1 text-sm text-ink-soft">{recipe.plain}</p>
                </div>
                <button type="button" className="btn btn-signal" onClick={() => void turnOn(recipe)}>
                  {recipe.status === "works" ? "Turn on" : "Request"}
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}
