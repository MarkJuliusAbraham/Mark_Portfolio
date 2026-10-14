
import {Routes, Route} from "react-router-dom";
import {BasePage} from "@/pages/BasePage.jsx";
import {Home} from "lucide-react";
import {HomePage} from "@/pages/HomePage.jsx";
import {ProjectPage} from "@/pages/ProjectPage.jsx";

export const App = () => {

  return (
    <Routes>
      <Route element={<BasePage/>}>
        <Route path="/" element={<HomePage/>}/>
        <Route path="/projects/:projectId" element={<ProjectPage />} />
      </Route>
    </Routes>
  );
}