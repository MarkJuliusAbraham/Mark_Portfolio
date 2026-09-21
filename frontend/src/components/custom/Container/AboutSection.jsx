import {ThreeTierInfo} from "@/components/custom/Cards/ThreeTierInfo.jsx";
import {DualDisplay} from "@/components/custom/Container/DualDisplay.jsx";
import {TitledCard} from "@/components/custom/Cards/TitledCard.jsx";

export const AboutSection = ({ref}) => {

  const about = [
    {
      header: "Experience",
      contents: [
        {
          toner: "2026",
          title: "FDM Group | Software Developer",
          readable: "SDLC, Web Applications, AI integration, and Modernization Projects"
        },
        {
          toner: "2025",
          title: "AlbertaEnvirothon | Software Developer",
          readable: "Coursework, Client-work, Full Stack development"
        }
      ]
    },
    {
      header: "Education",
      contents: [
        {
          toner: "2020 - 2025",
          title: "Major in Computer Science with a Minor in Mathematics",
          readable: "University of Alberta | Bachelor of Science"
        }
      ]
    },
  ]

  return (
    <section ref={ref}>
      <DualDisplay>
        {
          about.map((entry, index) => (
            <TitledCard key={index} title={entry.header}>
              {entry.contents.map((item, i) => (
                <ThreeTierInfo
                  key = {i}
                  toner={item.toner}
                  title={item.title}
                  readable={item.readable}
                ></ThreeTierInfo>
              ))}
            </TitledCard>
          ))
        }
      </DualDisplay>
    </section>
  );
}