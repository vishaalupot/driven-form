"use client";

import { useState } from "react";
import type { FormSchema } from "@/types/schema";
import rawSchema from "../data/schema.json";
import FormRenderer from "../components/form/FormRender";
import ConfirmationPage from "../components/form/ConfirmationPage";
import { useFormState } from "@/hooks/useFormState";


export default function Page() {
  const schema = rawSchema as FormSchema;
  const [step, setStep] = useState(0);
  const { formData, updateField } = useFormState({});
  const [validateCurrentStep, setValidateCurrentStep] = useState<(() => Promise<boolean>) | null>(null);

  if (!schema?.steps?.[step]) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-neutral-100">
        <p className="text-neutral-500 text-lg">Loading...</p>
      </div>
    );
  }

  const next = async () => {
    if (validateCurrentStep) {
      const isValid = await validateCurrentStep();
      if (isValid) setStep((prev) => prev + 1);
    }
  };

  const [progressTextIndex, setProgressTextIndex] = useState(0);
<link
  href="https://fonts.googleapis.com/css2?family=Dancing+Script&family=Great+Vibes&family=Pacifico&display=swap"
  rel="stylesheet"
/>

const texts = [
  <>25% </>,
  <>50% </>,
  <>75% </>,
  <>99% </>,
];


const nexts = async () => {
  if (validateCurrentStep) {
    const isValid = await validateCurrentStep();
    if (isValid) {
      setStep((prev) => prev + 1);
      setProgressTextIndex((prev) => (prev + 1) % texts.length);
    }
  }
};


  const back = () => setStep((prev) => prev - 1);
  const handleEdit = (stepIndex: number) => setStep(stepIndex);

  const handleSubmit = () => {
    const jsonStr = JSON.stringify(formData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "formData.json";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };
  

  const lastStepIndex = schema.steps.length - 1;
  const progress = ((step + 1) / schema.steps.length) * 100;

  return (
    <main className="relative min-h-screen overflow-hidden">

      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        src="https://cdn.sanity.io/files/74l1zcgb/production/572466e7a90003b155357bb6708775bd0b9a95f8.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="absolute inset-0 bg-black/65 bg-opacity-90 z-0" />

          <div
      className="absolute left-6 top-[37%] transform -translate-y-1/2 z-10 text-left text-white/40 select-none text-[250px]"
      style={{ fontFamily: "'Great Vibes', cursive" }}
    >
      {texts[progressTextIndex]}
    </div>
    <div  className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10 text-left text-white/40 select-none text-[50px]"
      style={{ fontFamily: "'Great Vibes', cursive" }}><br /> Closer To Your Dream Home</div>

      <div className="relative z-20 flex justify-end items-center min-h-screen px-8">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl p-6 sm:p-6 border border-neutral-200 h-[700px] overflow-y-auto">


          <p className="text-neutral-600 text-lg text-center">
            Step {step + 1} of {schema.steps.length} — {schema.steps[step].title}
          </p>

          <div className="h-[600px] flex flex-col overflow-hidden">
          <div className="mt-6 w-full">
            <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
              <div
                className="h-3 bg-gradient-to-r from-black via-neutral-800 to-neutral-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          <section className="mt-8 flex-grow overflow-y-auto">
            {step === lastStepIndex ? (
              <ConfirmationPage
                formData={formData}
                schema={schema}
                onEdit={handleEdit}
                onSubmit={handleSubmit}
              />
            ) : (
              <FormRenderer
                schema={schema}
                step={step}
                formData={formData}
                updateField={updateField}
                onValidationChange={(isValid, validateFn) =>
                  setValidateCurrentStep(() => validateFn)
                }
              />
            )}
          </section>

          <nav className=" flex justify-between items-center mt-4">
            {step > 0 ? (
              <button
                onClick={back}
                type="button"
                className="inline-flex items-center px-5 py-3 rounded-full border border-neutral-400 bg-white text-neutral-700 font-medium
                  shadow-sm hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition"
              >
                ← Back
              </button>
            ) : (
              <div />
            )}

            {step < lastStepIndex ? (
              <button
                onClick={nexts}
                type="button"
                className="inline-flex items-center px-6 py-3 rounded-full bg-black text-white font-semibold shadow-md
                  hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-transform transform hover:scale-105"
              >
                Next →
              </button>
            ) : (
              <div />
            )}
          </nav>
          </div>

          
        </div>
      </div>
    </main>
  );
}
