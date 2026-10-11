export function Flower({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={'flower ' + className} fill="none" aria-hidden="true">
      {Array.from({ length: 8 }, (_, i) => (
        <path key={i} d="M50 12V88" stroke="currentColor" strokeWidth="9" strokeLinecap="round" transform={'rotate(' + i * 22.5 + ' 50 50)'} />
      ))}
    </svg>
  );
}
