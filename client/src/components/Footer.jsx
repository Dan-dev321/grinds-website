const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-800/40 bg-[#161426]">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-6 py-8 text-center sm:flex-row sm:text-left">
        <div>
          {/* Bright white primary text */}
          <p className="text-sm font-semibold text-slate-50">
            © {new Date().getFullYear()} TutorNode
          </p>
          {/* Muted slate text for sub-labels */}
          <p className="mt-1 text-sm text-slate-400">
            Online Management for Tutors
          </p>
        </div>

        {/* Electric Purple Pop Tag for Location */}
        <div className="flex items-center gap-2 rounded-full border border-[#A855F7]/20 bg-[#A855F7]/10 px-3 py-1.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5">
          <span className="h-2 w-2 rounded-full bg-[#A855F7]" />
          <span className="text-xs font-semibold text-[#A855F7]">
            Ireland
          </span>
        </div>
      </div>
    </footer>
  )
}

export default Footer