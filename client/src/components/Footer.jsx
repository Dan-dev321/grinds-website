const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-200 bg-slate-50">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-6 py-8 text-center sm:flex-row sm:text-left">
        <div>
          <p className="text-sm font-semibold text-slate-900">
            © {new Date().getFullYear()} TutorNode
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Online Management for Tutors
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="text-xs font-medium text-slate-600">
            Ireland
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer