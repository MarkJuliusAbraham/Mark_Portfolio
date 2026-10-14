export const SidebarHeader = ({name, onClick}) => {
    return (
        <button type="button" className="sidebar-wordmark" onClick={onClick} aria-label={`${name} — go to home`}>
            {name}
        </button>
    );
}
