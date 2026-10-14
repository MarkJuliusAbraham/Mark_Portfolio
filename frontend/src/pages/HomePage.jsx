import {ScrollingContent} from "@/layout/ScrollingContent.jsx";
import {HomeBannerLayout} from "@/components/custom/Sections/Banner/HomeBannerLayout.jsx";
import {QuadDisplay} from "@/components/custom/Container/QuadDisplay.jsx";
import {ThreeTierInfo} from "@/components/custom/Cards/ThreeTierInfo.jsx";
import {PortfolioSection} from "@/components/custom/Sections/PortfolioSection.jsx";
import {AboutSection} from "@/components/custom/Container/AboutSection.jsx";
import {ProjectSection} from "@/components/custom/Sections/ProjectSection.jsx";
import {ContactSection} from "@/components/custom/Sections/ContactSection.jsx";
import {useOutletContext} from "react-router-dom";
import {useEffect} from "react";
import {useLocation} from "react-router-dom";
import bannerImage from "@/img/adam-hamel-MgmfPmixwE4-unsplash.jpg";

const heroProfile = {
  nameLines: ["Mark Julius", "Abraham"],
  description: "Designer / Developer",
  photo: {
    src: bannerImage,
    alt: "A camera held up against a blue sky",
    position: "50% 60%",
  },
};

export const HomePage = () => {

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

  const location = useLocation();

  const {
    homeRef,
    aboutRef,
    projectRef,
    educationRef,
    contactRef,
  } = useOutletContext();

  useEffect(() => {
    const section = location.state?.scrollTo;

    if (!section) return;

    const refs = {
      HOME: homeRef,
      ABOUT: aboutRef,
      PROJECTS: projectRef,
      EDUCATION: educationRef,
      CONTACT: contactRef,
    };

    refs[section.toUpperCase()]?.current?.scrollIntoView({
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "instant" : "smooth",
      block: "start",
    });
  }, [location.state, homeRef, aboutRef, projectRef, educationRef, contactRef]);


  return (
    <ScrollingContent ref={homeRef}>
      <div className="flex min-w-0 flex-col gap-8 sm:gap-12">
        <HomeBannerLayout profile={heroProfile} />
        <QuadDisplay>
          {card_entries.map((item) => (
            <ThreeTierInfo toner={item.toner} key={item.toner} title={item.title} readable={item.readable} />
          ))}
        </QuadDisplay>
      </div>
      <PortfolioSection ref={aboutRef} title="About Me">
        <AboutSection educationRef={educationRef} />
      </PortfolioSection>
      <PortfolioSection ref={projectRef} title="Solo Projects">
        <ProjectSection />
      </PortfolioSection>
      <PortfolioSection ref={contactRef} title="Contact Me">
        <ContactSection />
      </PortfolioSection>
    </ScrollingContent>
  );
}
