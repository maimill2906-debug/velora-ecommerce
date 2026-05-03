type VeloraLogoProps = {
  className?: string;
  size?: 'small' | 'medium' | 'large';
  showSubtitle?: boolean;
  showUnderline?: boolean;
};

export function VeloraLogo({
  className = "",
  size = 'large',
  showSubtitle = true,
  showUnderline = true
}: VeloraLogoProps) {
  const sizeClasses = {
    small: 'velora-logo-small',
    medium: 'velora-logo-medium',
    large: 'velora-logo-large'
  };

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative">
        <h1 className={`velora-logo-text ${sizeClasses[size]}`}>
          <span className="velora-v">V</span>
          <span className="velora-e">E</span>
          <span className="velora-l">L</span>
          <span className="velora-o">
            O
            <span className="velora-o-ring" aria-hidden="true"></span>
          </span>
          <span className="velora-r">R</span>
          <span className="velora-a">A</span>
        </h1>
        {showUnderline && <div className="velora-logo-underline"></div>}
      </div>

      {showSubtitle && <p className="velora-logo-subtitle">MINIMAL FASHION</p>}
    </div>
  );
}
