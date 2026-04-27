type IconProps = { className?: string };

export function InstagramIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2.2c3.2 0 3.6 0 4.85.07 1.17.05 1.8.25 2.23.4.55.22.95.49 1.37.9.41.42.68.82.9 1.37.15.42.35 1.06.4 2.23.07 1.25.07 1.65.07 4.85s0 3.6-.07 4.85c-.05 1.17-.25 1.8-.4 2.23-.22.55-.49.95-.9 1.37a3.7 3.7 0 0 1-1.37.9c-.42.15-1.06.35-2.23.4-1.25.07-1.65.07-4.85.07s-3.6 0-4.85-.07c-1.17-.05-1.8-.25-2.23-.4a3.7 3.7 0 0 1-1.37-.9 3.7 3.7 0 0 1-.9-1.37c-.15-.42-.35-1.06-.4-2.23C2.2 15.6 2.2 15.2 2.2 12s0-3.6.07-4.85c.05-1.17.25-1.8.4-2.23.22-.55.49-.95.9-1.37.42-.41.82-.68 1.37-.9.42-.15 1.06-.35 2.23-.4C8.4 2.2 8.8 2.2 12 2.2zm0 5.5a4.3 4.3 0 1 0 0 8.6 4.3 4.3 0 0 0 0-8.6zm0 7.1a2.8 2.8 0 1 1 0-5.6 2.8 2.8 0 0 1 0 5.6zm5.5-7.27a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" />
    </svg>
  );
}

export function FacebookIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M22 12a10 10 0 1 0-11.56 9.88V14.9H7.9V12h2.54V9.8c0-2.5 1.5-3.9 3.78-3.9 1.1 0 2.24.2 2.24.2v2.46h-1.27c-1.24 0-1.63.78-1.63 1.57V12h2.78l-.45 2.9h-2.33v6.98A10 10 0 0 0 22 12z" />
    </svg>
  );
}

export function TwitterIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.45-6.231zm-1.16 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

export function YoutubeIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.12C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.4.53A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.12c1.9.53 9.4.53 9.4.53s7.5 0 9.4-.53a3 3 0 0 0 2.1-2.12c.4-1.9.5-3.84.5-5.8s-.1-3.9-.5-5.8zM9.6 15.6V8.4l6.27 3.6-6.27 3.6z" />
    </svg>
  );
}

export function WhatsappIcon({ className }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.36c-.3-.15-1.74-.86-2-.96-.27-.1-.47-.15-.67.15s-.77.96-.94 1.16c-.18.2-.35.22-.65.07-.3-.15-1.24-.46-2.36-1.46a8.85 8.85 0 0 1-1.63-2.03c-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.49s1.07 2.89 1.22 3.09c.15.2 2.1 3.21 5.1 4.5.71.31 1.27.49 1.7.62.71.23 1.36.2 1.87.12.57-.08 1.74-.71 1.99-1.4.25-.69.25-1.28.17-1.4-.08-.13-.27-.2-.57-.35zM12 2A10 10 0 0 0 3.4 17.06L2 22l5.07-1.33A10 10 0 1 0 12 2zm0 18.18a8.16 8.16 0 0 1-4.16-1.14l-.3-.18-3.01.79.8-2.93-.2-.3a8.18 8.18 0 1 1 6.87 3.76z" />
    </svg>
  );
}

export function getIconById(id: string, className = "w-5 h-5") {
  switch (id) {
    case "instagram": return <InstagramIcon className={className} />;
    case "facebook":  return <FacebookIcon  className={className} />;
    case "twitter":   return <TwitterIcon   className={className} />;
    case "youtube":   return <YoutubeIcon   className={className} />;
    case "whatsapp":  return <WhatsappIcon  className={className} />;
    default: return null;
  }
}
