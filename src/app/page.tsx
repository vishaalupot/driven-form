"use client";

import { useState } from "react";
import type { FormSchema } from "@/types/schema";
import rawSchema from "../data/schema.json";
import FormRenderer from "../components/form/FormRender";
import ConfirmationPage from "../components/form/ConfirmationPage";
import { useFormState } from "@/hooks/useFormState";
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight } from 'lucide-react';


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

  const texts = [
    <>25% </>,
    <>50% </>,
    <>75% </>,
  ];

  const nexts = async () => {
    if (validateCurrentStep) {
      const isValid = await validateCurrentStep();
      if (isValid) {
        setStep((prev) => prev + 1);
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
    <>
    <main className="relative min-h-screen overflow-hidden font-['Open_Sans',_sans-serif]">

      <video
        className="absolute top-0 left-0 w-full h-full object-cover"
        src="https://cdn.sanity.io/files/74l1zcgb/production/572466e7a90003b155357bb6708775bd0b9a95f8.mp4"
        autoPlay
        loop
        muted
        playsInline
      />

      <div className="absolute inset-0 bg-black/65 bg-opacity-90 z-0" />
      <div className={`absolute left-1/2 top-4 -translate-x-1/2 md:left-6 md:top-[37%] md:translate-x-0 logo transition-opacity duration-1000 block ${step === 0 || step === 3? 'opacity-90' : 'opacity-0 pointer-events-none'}`}>
      <Image
        src="https://cdn.prod.website-files.com/669c926e032b8db8b91cd9b5/66ada4ebaaa33b9b2da87a5a_Driven%20Forbes-06-p-500.png"
        alt="Driven Forbes logo"
        width={550}
        height={150}
        className="w-30 h-auto md:w-[550px]"
      />
      </div>

      <div className={`progress transition-opacity duration-1000 hidden md:block ${step > 0 && step !== 3 ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
        <div
          className="absolute left-6 top-[37%] transform -translate-y-1/2 z-10 text-left text-white/70 select-none text-[250px] font-semibold duration-1000"
          style={{ fontFamily:"'Open Sans', sans-serif" }}
        >
          {texts[(step+1) - 1]}
        </div>
        <div className="absolute left-8 top-1/2 transform -translate-y-1/2 z-10 text-left text-white/70 select-none text-[32px]"
          style={{ fontFamily:"'Open Sans', sans-serif" }}>
          <br /> CLOSE TO YOUR DREAM PROPERTY
        </div>
      </div>

      <div className="relative z-20 flex justify-center md:justify-end items-center min-h-screen px-4 md:px-8">
      <div className="w-full max-w-lg bg-white shadow-xl rounded-2xl border-neutral-200 h-[85vh] overflow-y-auto">

         
            <div className="flex flex-col overflow-hidden p-6 h-full">
               <p className="text-neutral-600 text-lg text-center pt-6">
            Step {step + 1} of {schema.steps.length} — {schema.steps[step].title}
          </p>
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

            <nav className="flex justify-between items-center mt-4">
  {step > 0 ? (
    <Button 
      onClick={back}
      variant="outline"
      className="inline-flex items-center gap-2"
    >
      <ChevronLeft className="h-4 w-4" />
      Back
    </Button>
  ) : (
    <div />
  )}

  {step < lastStepIndex ? (
    <Button 
      onClick={nexts}
      className="inline-flex items-center gap-2"
    >
      Next
      <ChevronRight className="h-4 w-4" />
    </Button>
  ) : (
    <div />
  )}
</nav>
          </div>
        </div>
      </div>
    </main>
    </>
  );
}