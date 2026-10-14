import {Input} from "@/components/ui/input.jsx";
import {FadeInComponent} from "@/components/custom/Animated/FadeInComponent.jsx";
import {Button} from "@/components/ui/button.jsx";
import {Field, FieldGroup, FieldLabel} from "@/components/ui/field.jsx";
import {Textarea} from "@/components/ui/textarea.jsx";

export const EmailComponent = ({className}) => {
  return (
    <div className={className}>
      <FadeInComponent className="pb-4">
        <div className="py-4">
          Got Anything to say? Email Me!
        </div>
        <div className="flex flex-col">

          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="nameInput" className="sr-only">Name</FieldLabel>
              <div
              >
                <Input
                  id="nameInput"
                  autoComplete="name"
                  className="min-h-11 text-base md:text-base"
                  placeholder="Your Name"
                />
              </div>
              <FieldLabel htmlFor="emailInput" className="sr-only">Email</FieldLabel>
              <div
              >
                <Input
                  id="emailInput"
                  type="email"
                  autoComplete="email"
                  className="min-h-11 text-base md:text-base"
                  placeholder="Your Email"
                  required
                />
              </div>
              <FieldLabel htmlFor="textArea" className="sr-only">Message</FieldLabel>
              <div
              >
                <Textarea
                  id="textArea"
                  className="min-h-36 text-base md:text-base"
                  placeholder="Your Message"
                />
              </div>
              <Button className="min-h-11">Submit</Button>
            </Field>
          </FieldGroup>
        </div>
      </FadeInComponent>
    </div>
    )
}
