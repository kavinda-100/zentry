import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/(about)/about/me')({
  component: RouteComponent,
})

function RouteComponent() {
  return <div>Hello "/(about)/about/me"!</div>
}
