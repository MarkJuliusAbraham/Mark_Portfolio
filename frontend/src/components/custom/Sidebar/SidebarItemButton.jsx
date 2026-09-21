import {ArrowRightIcon} from "lucide-react";
import {Button} from "@/components/ui/button.jsx";

export const SidebarItemButton = ({href, label, onClick}) => {
    return (
        <Button
            variant="ghost"
            onClick = {onClick}
            className="group my-0.5 h-16 w-full justify-between rounded-none p-0 hover:bg-transparent hover:shadow-[inset_0_-2px_0_0_black]"
        >
            <div className="typeset-nav-item">
                {label}
            </div>

            <ArrowRightIcon
                className="scale-150 opacity-0 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100"
            />
        </Button>
    );
}