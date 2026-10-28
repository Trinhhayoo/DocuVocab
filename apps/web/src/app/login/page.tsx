export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center">
      <h1 className="sr-only">Login</h1>
      {/* A plain GET to the sign-in route, which builds the OAuth callback from the request URL. */}
      <form action="/auth/web/login" method="get">
        <button className="rounded-xl bg-primary px-5 py-3 text-primary-foreground">
          Continue with Google
        </button>
      </form>
    </main>
  );
}
