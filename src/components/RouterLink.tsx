import { Link } from 'react-router-dom';
import type { LinkComponent } from '@rakuensoftware/smoothgui';

/**
 * Adapts react-router's Link to the shape smoothgui's navigational components
 * expect. smoothgui never imports a router itself.
 */
const RouterLink: LinkComponent = ({ href, children, ...rest }) => (
  <Link to={href} {...rest}>{children}</Link>
);

export default RouterLink;
