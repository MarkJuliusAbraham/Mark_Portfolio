import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { useMediaQuery } from "@/hooks/useMediaQuery.js";
import { phoneQuery } from "@/lib/media.js";
import "./contact-bar.css";

/**
 * On phones, keeps the way to get in touch within reach: once the hero's own actions have scrolled
 * up out of view, a bar slides up at the foot of the screen, and it slides away again as the
 * contact section (`contactRef`) comes into view. `onContact` is what its button does.
 */
export const ContactBar = ({ contactRef, onContact }) => {
  const phone = useMediaQuery(phoneQuery);
  const [actionsGone, setActionsGone] = useState(false);
  const [contactNear, setContactNear] = useState(false);

  useEffect(() => {
    const actions = document.querySelector(".hero-actions");
    const contact = contactRef.current;
    if (!phone || !actions || !contact) return;

    // Gone means scrolled up past, not yet reached below.
    const watchActions = new IntersectionObserver(([entry]) => {
      setActionsGone(!entry.isIntersecting && entry.boundingClientRect.bottom <= 0);
    });
    // Near as soon as the contact section's top is a little way into the screen.
    const watchContact = new IntersectionObserver(([entry]) => {
      setContactNear(entry.isIntersecting || entry.boundingClientRect.top <= 0);
    }, { rootMargin: "0px 0px -10% 0px" });
    watchActions.observe(actions);
    watchContact.observe(contact);
    return () => {
      watchActions.disconnect();
      watchContact.disconnect();
    };
  }, [phone, contactRef]);

  const shown = phone && actionsGone && !contactNear;
  if (!phone) return null;

  return (
    <div className="contact-bar" data-theme="inverse-card" data-shown={shown} inert={!shown} aria-hidden={!shown || undefined}>
      <button type="button" className="contact-bar-button" onClick={onContact}>
        <span>Get in touch</span>
        <ArrowRight size={18} strokeWidth={1.5} aria-hidden="true" />
      </button>
    </div>
  );
};
