export default function UsersPage() {
  return (
    <section>
      <h1 className="text-2xl md:text-3xl font-bold">Users</h1>
      <p className="mt-2 text-sm text-muted-foreground">Manage user roles and permissions.</p>
      <div className="mt-6 overflow-hidden rounded-md border">
        <div className="grid grid-cols-12 bg-muted px-3 py-2 text-sm font-medium">
          <div className="col-span-4">Name</div>
          <div className="col-span-4">Email</div>
          <div className="col-span-4">Role</div>
        </div>
        {[
          ["Alex Johnson", "alex@example.com", "Employee"],
          ["Dana Park", "dana@example.com", "Manager"],
        ].map((r, i) => (
          <div key={i} className="grid grid-cols-12 border-t px-3 py-3 text-sm items-center">
            <div className="col-span-4">{r[0]}</div>
            <div className="col-span-4">{r[1]}</div>
            <div className="col-span-4">{r[2]}</div>
          </div>
        ))}
      </div>
    </section>
  )
}
