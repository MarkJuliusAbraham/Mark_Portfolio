import { useEffect } from "react";
import { useLocation, useOutletContext } from "react-router-dom";
import { ScrollingContent } from "@/components/templates/ScrollingContent.jsx";
import { PortfolioSection } from "@/components/templates/PortfolioSection.jsx";
import { HomeBannerLayout } from "@/components/organisms/Hero/HomeBannerLayout.jsx";
import { AboutSection } from "@/components/organisms/About/AboutSection.jsx";
import { ProjectSection } from "@/components/organisms/ProjectSection.jsx";
import { ContactSection } from "@/components/organisms/ContactSection.jsx";
import { ContactBar } from "@/components/organisms/ContactBar/ContactBar.jsx";
import { focusAreas, heroProfile } from "@/content/home.js";
import { scrollToElement } from "@/lib/scroll.js";

export const HomePage = () => {
  const location = useLocation();
  const { sections } = useOutletContext();
  const { Home: homeRef, About: aboutRef, Projects: projectsRef, Education: educationRef, Contact: contactRef } = sections;

  // Arriving from another page, scroll to the section the navigation asked for.
  useEffect(() => {
    scrollToElement(sections[location.state?.scrollTo]?.current);
  }, [location.state, sections]);

  const goToContact = () => scrollToElement(contactRef.current);

  return (
    <ScrollingContent ref={homeRef}>
      <HomeBannerLayout
        layout="inverse"
        profile={heroProfile}
        focusAreas={focusAreas}
        actions={[
          { label: "View projects", onClick: () => scrollToElement(projectsRef.current) },
          { label: "Get in touch", variant: "outline", onClick: goToContact },
        ]}
      />
      <AboutSection ref={aboutRef} educationRef={educationRef} />
      <ProjectSection ref={projectsRef} title="Solo Projects" />
      <PortfolioSection ref={contactRef} title="Contact Me" titleEntrance="none">
        <ContactSection />
      </PortfolioSection>
      <ContactBar contactRef={contactRef} onContact={goToContact} />
    </ScrollingContent>
  );
};
