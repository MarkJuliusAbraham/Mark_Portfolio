import { FiGithub, FiLinkedin, FiYoutube } from "react-icons/fi";

const socialLinks = [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/mark-julius-abraham/", icon: FiLinkedin },
    { label: "GitHub", href: "https://github.com/MarkJuliusAbraham", icon: FiGithub },
    { label: "YouTube", href: "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ", icon: FiYoutube },
];

export const SidebarFooter = ({name}) => {
    return (
        <div className="sidebar-footer">
            <div className="sidebar-footer-inner">
                <a href={`mailto:${name}`} className="sidebar-email">
                    {name}
                </a>
                <div className="sidebar-socials">
                    {socialLinks.map(({ label, href, icon: Icon }) => (
                        <a key={label} href={href} aria-label={label} className="sidebar-social-link">
                            <Icon className="size-[18px]" strokeWidth={1.5} aria-hidden="true" />
                        </a>
                    ))}
                </div>
            </div>
        </div>
    )
}
