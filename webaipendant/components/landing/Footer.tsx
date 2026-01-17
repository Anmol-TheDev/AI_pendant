export function Footer() {
  return (
    <footer className="py-12 border-t border-neutral-200 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="text-center md:text-left">
            <h3 className="text-xl font-bold font-heading mb-1 text-neutral-900">
              Pendant
            </h3>
            <p className="text-sm text-neutral-500">
              Open source wearable management interface.
            </p>
          </div>

          <div className="flex gap-6 text-sm text-neutral-500">
            <a href="https://github.com/Anmol-TheDev/AI_pendant" target="_blank" className="hover:text-black transition-colors">
              GitHub
            </a>
            <a href="https://x.com/Hyperion9913" target="_blank" className="hover:text-black transition-colors">
              Twitter
            </a>
          </div>

          <div className="text-sm text-neutral-400">
            © {new Date().getFullYear()} Slay Queens. MIT License.
          </div>
        </div>
      </div>
    </footer>
  );
}
