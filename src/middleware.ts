import { auth } from "@/lib/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  if (!req.auth) {
    const url = new URL("/login", req.url)
    url.searchParams.set("callbackUrl", req.url)
    return NextResponse.redirect(url)
  }
})

export const config = {
  matcher: ["/((?!login|api/auth|_next/static|_next/image|favicon.ico).*)"],
}