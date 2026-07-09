import { auth } from "@/lib/auth"
import { Navbar } from "@/components/Navbar"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  return (
    <div className="flex h-screen overflow-hidden">
      <Navbar />
      <main className="flex-1 overflow-y-auto bg-background p-4 md:p-6 lg:p-8">
        {children}
      </main>
    </div>
  )
}
