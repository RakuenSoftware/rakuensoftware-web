import type { ReactNode } from 'react';
import type { ButtonVariant } from '@rakuensoftware/smoothgui';
import RouterLink from './RouterLink';

interface ButtonLinkProps {
  href: string;
  variant?: ButtonVariant;
  children: ReactNode;
}

/**
 * A link that looks like a SmoothGUI Button. Wrapping <Button> in <a> nests an
 * interactive element inside another, which is invalid HTML and gives keyboard
 * users two tab stops for one action. External and in-page hrefs render a plain
 * anchor; site paths go through the router.
 */
export default function ButtonLink({ href, variant = 'default', children }: ButtonLinkProps) {
  const className = `sg-button sg-button--${variant} sg-button--md site-button-link`;
  if (href.startsWith('/')) {
    return <RouterLink href={href} className={className}>{children}</RouterLink>;
  }
  const external = /^https?:\/\//.test(href);
  return (
    <a href={href} className={className} {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}>
      {children}
    </a>
  );
}
