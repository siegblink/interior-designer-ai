import { BLOB_ORIGIN, blob, cookieJar, type ListedBlob } from "./setup";
import { describe, expect, test } from "bun:test";
import { isValidElement, type ReactNode } from "react";
import { ADMIN_SESSION_COOKIE, createAdminSession } from "@/lib/admin-session";
import type { Design } from "@/lib/gallery";

const { default: GalleryPage } = await import("@/app/(main)/gallery/page");
const { default: AdminPage } = await import("@/app/admin/page");
const { AdminSignIn } = await import("@/components/admin-sign-in");

function stored(pathname: string, uploadedAt: string): ListedBlob {
  return {
    pathname,
    url: `${BLOB_ORIGIN}/${pathname}`,
    uploadedAt: new Date(uploadedAt),
  };
}

/** The `initialDesigns` a page hands to its grid, or null when it shows none. */
function designsIn(node: ReactNode): Design[] | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = designsIn(child);
      if (found) return found;
    }
    return null;
  }
  if (!isValidElement(node)) return null;
  const props = node.props as {
    initialDesigns?: Design[];
    children?: ReactNode;
  };
  return props.initialDesigns ?? designsIn(props.children);
}

function signInAsAdmin() {
  const session = createAdminSession();
  if (!session) throw new Error("expected a session");
  cookieJar.set(ADMIN_SESSION_COOKIE, session);
}

const TWO_DESIGNS = [
  stored("designs/1_Modern_Bedroom.png", "2026-01-01T00:00:00Z"),
  stored("designs/2_Coastal_Kitchen.png", "2026-02-01T00:00:00Z"),
];

describe("/gallery", () => {
  test("shows the saved designs, newest first", async () => {
    blob.listed = TWO_DESIGNS;

    const designs = designsIn(await GalleryPage());

    expect(designs?.map((design) => design.theme)).toEqual([
      "Coastal",
      "Modern",
    ]);
  });

  test("does not list the Blob store on every view", async () => {
    blob.listed = TWO_DESIGNS;

    for (let i = 0; i < 20; i++) await GalleryPage();

    expect(blob.listCalls).toHaveLength(1);
  });

  test("shows an empty gallery when the Blob store is unavailable", async () => {
    blob.error = new Error("Vercel Blob: store unavailable");

    expect(designsIn(await GalleryPage())).toEqual([]);
  });
});

describe("/admin", () => {
  test("never lists the store for visitors who are not signed in", async () => {
    blob.listed = TWO_DESIGNS;

    const signedOut = await AdminPage();
    expect(isValidElement(signedOut) && signedOut.type).toBe(AdminSignIn);
    cookieJar.set(ADMIN_SESSION_COOKIE, "not-a-session");
    const badSession = await AdminPage();
    expect(isValidElement(badSession) && badSession.type).toBe(AdminSignIn);

    expect(blob.listCalls).toHaveLength(0);
  });

  test("shows a signed-in admin the store as it is, without the cache", async () => {
    signInAsAdmin();
    blob.listed = TWO_DESIGNS;
    expect(designsIn(await AdminPage())).toHaveLength(2);

    blob.listed = [TWO_DESIGNS[0]];
    expect(designsIn(await AdminPage())).toHaveLength(1);
    expect(blob.listCalls).toHaveLength(2);
  });

  test("shows an empty list when the Blob store is unavailable", async () => {
    signInAsAdmin();
    blob.error = new Error("Vercel Blob: store unavailable");

    expect(designsIn(await AdminPage())).toEqual([]);
  });
});
