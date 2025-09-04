import { BottomTabBar } from '@/components/bottom-tab-bar'

export default function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      {children}
      <BottomTabBar />
    </>
  )
}