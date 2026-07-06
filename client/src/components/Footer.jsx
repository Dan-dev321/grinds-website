const Footer = () => {
  return (
    <footer className="bg-brand-700 text-white text-center py-5 text-sm mt-auto">
      <p className="font-medium">
        © {new Date().getFullYear()} TutorNode · Online Management for Tutors
      </p>
      <p className="text-brand-300 text-xs mt-1">
        Ireland 🇮🇪
      </p>
    </footer>
  )
}

export default Footer