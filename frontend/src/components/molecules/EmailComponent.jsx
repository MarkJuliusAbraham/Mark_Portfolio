import { Button } from "@/components/ui/button.jsx";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field.jsx";
import { Input } from "@/components/ui/input.jsx";
import { Textarea } from "@/components/ui/textarea.jsx";

const fieldText = "text-base md:text-base";

/** The contact form: name, email and message, each with a screen-reader label. */
export const EmailComponent = ({ className }) => (
  <div className={className}>
    <div className="pb-4">
      <div className="py-4">Got Anything to say? Email Me!</div>
      <FieldGroup>
        <Field>
          <FieldLabel htmlFor="nameInput" className="sr-only">Name</FieldLabel>
          <Input id="nameInput" autoComplete="name" placeholder="Your Name" className={`min-h-11 ${fieldText}`} />
          <FieldLabel htmlFor="emailInput" className="sr-only">Email</FieldLabel>
          <Input id="emailInput" type="email" autoComplete="email" placeholder="Your Email" required className={`min-h-11 ${fieldText}`} />
          <FieldLabel htmlFor="textArea" className="sr-only">Message</FieldLabel>
          <Textarea id="textArea" placeholder="Your Message" className={`min-h-36 ${fieldText}`} />
          <Button className="min-h-11">Submit</Button>
        </Field>
      </FieldGroup>
    </div>
  </div>
);
