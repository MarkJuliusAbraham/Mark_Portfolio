import {Separator} from "@/components/ui/separator.jsx";
import {Text} from "lucide-react";
import {Fa0} from "react-icons/fa6";
import {FaEnvelope, FaGithub, FaLinkedin, FaYoutube} from "react-icons/fa";

export const SidebarFooter = ({name}) => {
    return (
        <div>

            <a
                href="mailto:mjabraham00@gmail.com"
                className="flex items-center px-2 py-1 justify-between"
            >
                <div className="typeset-nav-footer">
                    {name}
                </div>
            </a>
            <Separator className="bg-black" />

            <div className="flex justify-between">
                <a
                    href="https://www.linkedin.com/in/mark-julius-abraham/"
                    className="flex h-12 w-12 items-center justify-center"
                >
                    <FaLinkedin className="h-7 w-7" />
                </a>

                <a
                    href="https://github.com/MarkJuliusAbraham"
                    className="flex h-12 w-12 items-center justify-center"
                >
                    <FaGithub className="h-7 w-7" />
                </a>
                <a
                    href="https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=RDdQw4w9WgXcQ"
                    className="flex h-12 w-12 items-center justify-center"
                >
                    <FaYoutube className="h-7 w-7" />
                </a>
            </div>
        </div>
    )
}