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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    );
  }

  const next = async () => {
    if (validateCurrentStep) {
      const isValid = await validateCurrentStep();
      if (isValid) setStep((prev) => prev + 1);
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
  const progressLabels = [
    "25% closer to your dream home",
    "50% closer to your dream home",
    "75% closer to your dream home",
    "You’re home!"
  ];

  return (
    <main
      className="min-h-screen bg-cover bg-center py-12 px-4 sm:px-6 lg:px-8"
      style={{
        backgroundImage: "url('/luxury-bg.jpg')",
      }}
    >
      <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-md shadow-2xl rounded-2xl p-8 sm:p-12 border border-gray-200">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-4xl font-extrabold text-indigo-900 tracking-tight mb-4 font-playfair">
            DRIVEN PROPERTIES
          </h1>
          <p className="text-gray-700 text-lg">
            Step {step + 1} of {schema.steps.length} - {schema.steps[step].title}
          </p>

          {/* Circular progress display */}
          <div className="mt-6 flex flex-col items-center">
            <div className="relative w-32 h-32">
              <svg className="absolute inset-0" viewBox="0 0 36 36">
                <path
                  className="text-gray-300"
                  strokeWidth="3"
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
                <path
                  className="text-indigo-600 transition-all duration-500"
                  strokeWidth="3"
                  strokeDasharray={`${progress}, 100`}
                  stroke="currentColor"
                  fill="none"
                  d="M18 2.0845
                    a 15.9155 15.9155 0 0 1 0 31.831
                    a 15.9155 15.9155 0 0 1 0 -31.831"
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-xl font-bold text-indigo-700">
                {Math.round(progress)}%
              </span>
            </div>
            <p className="mt-4 text-indigo-700 font-semibold text-lg">
              {progressLabels[step]}
            </p>
          </div>
        </header>

        {/* Form or Confirmation */}
        <section>
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

        {/* Navigation Buttons */}
        <nav className="flex justify-between items-center mt-12">
          {step > 0 ? (
            <button
              onClick={back}
              type="button"
              className="inline-flex items-center px-5 py-3 rounded-full border border-gray-300 bg-white text-gray-700 font-medium
                shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition"
            >
              &larr; Back
            </button>
          ) : (
            <div />
          )}

          {step < lastStepIndex ? (
            <button
              onClick={next}
              type="button"
              className="inline-flex items-center px-6 py-3 rounded-full bg-indigo-600 text-white font-semibold shadow-lg
                hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-transform transform hover:scale-105"
            >
              Next &rarr;
            </button>
          ) : (
            <div />
          )}
        </nav>
      </div>
    </main>
  );
}
