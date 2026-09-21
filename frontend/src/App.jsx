import {Sidebar} from "./components/custom/Sidebar/Sidebar.jsx";
import {SidebarFooter} from "@/components/custom/Sidebar/SidebarFooter.jsx";
import {SidebarItemButton} from "@/components/custom/Sidebar/SidebarItemButton.jsx";
import { useRef, useState } from "react";
import {BackgroundFlavorText} from "@/components/custom/BackgroundFluff/BackgroundFlavorText.jsx";
import {MouseFollower} from "@/components/custom/BackgroundFluff/MouseFollower.jsx";
import {Card} from "@/components/ui/card.jsx";
import {ScrollingContent} from "@/layout/ScrollingContent.jsx";
import {ThreeTierInfo} from "@/components/custom/Cards/ThreeTierInfo.jsx";
import {FadeInComponent} from "@/components/custom/Animated/FadeInComponent.jsx";
import {PopInComponent} from "@/components/custom/Animated/PopInComponent.jsx";
import {NameBanner} from "@/components/custom/Banner/NameBanner.jsx";
import {HomeBannerLayout} from "@/components/custom/Banner/HomeBannerLayout.jsx";
import {BasicContainer} from "@/components/custom/Container/BasicContainer.jsx";

export const App = () => {

  const name = "Mark Julius";
  const [activeSection, setActiveSection] = useState("HOME");

  const temp_items = [
      { label: "Home", href: "/" },
      { label: "About", href: "/about" },
      { label: "Projects", href: "/projects" },
      { label: "Education", href: "/education" },
  ];

  const card_entries = [
    { toner: "01", title: "UI/UX Design", readable: "Designing and building polished, responsive frontend experiences."},
    {
      toner: "02",
      title: "AI Architecture",
      readable: "I believe AI should be accessible and useful to everyone."
    },
    {
      toner: "03",
      title: "Software Engineering",
      readable: "Experience building scripts, web applications, and native software."
    },
    {
      toner: "04",
      title: "Game Enthusiast",
      readable: "I love games. Playing them, studying them, and getting lost in them."
    }
  ]

  return (
    <div className="flex min-h-screen mx-4">
      {/* Moving background text */}

      {/*<MouseFollower/>*/}
      <Sidebar email="mjabraham00@gmail.com">
        <nav className="flex flex-1 translate-y-[-20%] flex-col justify-center">
          {temp_items.map((item) => (
            <SidebarItemButton
              key={item.label}
              href={item.href}
              label={item.label}
              onClick={() => setActiveSection(item.label.toUpperCase())}
            />
          ))}
        </nav>
      </Sidebar>

      <MouseFollower/>

      <ScrollingContent>
        <HomeBannerLayout/>
        <BasicContainer>
          {card_entries.map((item) => (
            <ThreeTierInfo toner={item.toner} key={item.toner} title={item.title} readable={item.readable} />
          ))}
        </BasicContainer>
      </ScrollingContent>

      <BackgroundFlavorText activeSection={activeSection}/>

    </div>
  )
}