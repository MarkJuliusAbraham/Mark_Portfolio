import {Button} from "@/components/ui/button.jsx";

export const Sidebar = ({items}) => {

    const temp_items = [
        { label: "Home", href: "/" },
        { label: "Projects", href: "/projects" },
        { label: "About", href: "/about" },
        { label: "Contact", href: "/contact" },
    ];

    return (
        <aside className="w-60 px-2 min-h-screen">
            <div className="box-border min-h-screen flex flex-col">

                {/*header*/}
                <div className="typeset-badge">
                    MARK
                </div>

                {/*content*/}
                <nav className="flex flex-1 flex-col justify-center">
                    {temp_items.map((item) => (
                        <SidebarItem
                            key={item.label}
                            href={item.href}
                            label={item.label}
                        />
                    ))}
                </nav>

                {/*footer*/}
                <div className="typeset-badge">
                    FOOTER
                </div>
            </div>
        </aside>
    );
}

const SidebarItem = ({href, label}) => {
    return (
        <Button
            variant="ghost"
            className="relative w-full justify-start rounded-none hover:bg-transparent after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:bg-transparent hover:after:bg-black"
        >
            <div className="typeset-nav-item">
                {label}
            </div>
        </Button>
    );


}