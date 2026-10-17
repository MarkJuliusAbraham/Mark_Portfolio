import { FiGithub, FiLinkedin, FiYoutube } from "react-icons/fi";
import { email, socialLinks } from "@/content/profile.js";

const icons = { LinkedIn: FiLinkedin, GitHub: FiGithub, YouTube: FiYoutube };

/** Email and social links at the foot of the navigation. */
export const SidebarFooter = () => (
  <div className="sidebar-footer">
    <div className="sidebar-footer-inner">
      <a href={`mailto:${email}`} className="sidebar-email">{email}</a>
      <div className="sidebar-socials">
        {socialLinks.map(({ label, href }) => {
          const Icon = icons[label];
          return (
            <a key={label} href={href} aria-label={label} className="sidebar-social-link">
              <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
            </a>
          );
        })}
      </div>
    </div>
  </div>
);
