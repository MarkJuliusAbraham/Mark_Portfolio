import {useRef} from "react";

export const useScrollToComponent = () => {
  const targetRef = useRef(null);

  const scrollToComponent = () => {
    targetRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
  };

  return {
    targetRef,
    scrollToComponent
  }
}